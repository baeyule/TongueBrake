require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

app.use(cors());

app.use(
  express.json({
    limit: '20mb',
  })
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

function cleanText(value, maxLength = 60000) {
  return String(value || '')
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, maxLength);
}

function normalizeArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeScore(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, Math.round(number))
  );
}

/* =====================================================
   기본
===================================================== */

app.get('/', (req, res) => {
  res.json({
    message: 'Tongue Brake server is running.',
    appName: 'Tongue Brake',
    model: MODEL,
    pdfUpload: true,
    presentationAnalysis: true,
    situationRecommendation: true,
  });
});

app.get('/healthz', (req, res) => {
  res.json({
    ok: true,
    appName: 'Tongue Brake',
  });
});

/* =====================================================
   PDF 업로드 + 발표 분석
===================================================== */

app.post(
  '/upload-pdf',
  upload.single('file'),
  async (req, res) => {
    let parser = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'PDF 파일이 없습니다.',
        });
      }

      parser = new PDFParse({
        data: req.file.buffer,
      });

      const result = await parser.getText();

      const rawText = cleanText(
        result?.text || '',
        60000
      );

      const pages =
        Number(result?.total) ||
        Number(result?.numpages) ||
        0;

      if (!rawText) {
        return res.status(422).json({
          error:
            'PDF에서 읽을 수 있는 텍스트가 없습니다.',
        });
      }

      const analysisPrompt = `
다음은 사용자가 업로드한 발표 자료에서 추출한 텍스트다.

자료에 실제로 존재하는 내용만 사용한다.
자료에 없는 사실, 수치, 사례를 만들지 않는다.

발표 자료를 분석해서 다음 JSON만 반환한다.

{
  "topic": "",
  "summary": "",
  "keyPoints": [],
  "evidence": [],
  "numbers": [],
  "cases": [],
  "limitations": [],
  "questionTargets": []
}

각 배열에는 자료에서 실제로 확인되는 내용만 넣는다.
`;

      const completion =
        await openai.chat.completions.create({
          model: MODEL,
          messages: [
            {
              role: 'system',
              content:
                '너는 발표 자료 분석 시스템이다. 자료에 없는 내용을 절대 만들어내지 않는다.',
            },
            {
              role: 'user',
              content:
                `${analysisPrompt}

--- 발표 자료 ---
${rawText}
--- 발표 자료 끝 ---`,
            },
          ],
          response_format: {
            type: 'json_object',
          },
          temperature: 0.1,
          max_tokens: 1800,
        });

      const content =
        completion.choices?.[0]?.message?.content || '';

      const analysis = safeJsonParse(content);

      if (!analysis) {
        throw new Error(
          '발표 자료 분석 결과를 처리하지 못했습니다.'
        );
      }

      const presentationAnalysis = {
        topic: String(
          analysis.topic || ''
        ).trim(),

        summary: String(
          analysis.summary || ''
        ).trim(),

        keyPoints: normalizeArray(
          analysis.keyPoints
        ).slice(0, 12),

        evidence: normalizeArray(
          analysis.evidence
        ).slice(0, 12),

        numbers: normalizeArray(
          analysis.numbers
        ).slice(0, 12),

        cases: normalizeArray(
          analysis.cases
        ).slice(0, 12),

        limitations: normalizeArray(
          analysis.limitations
        ).slice(0, 10),

        questionTargets: normalizeArray(
          analysis.questionTargets
        ).slice(0, 12),
      };

      return res.json({
        success: true,
        filename: req.file.originalname,
        pages,
        text: rawText,
        presentationAnalysis,
      });
    } catch (error) {
      console.error('PDF 처리 오류:', error);

      return res.status(500).json({
        error:
          error?.message ||
          'PDF를 처리하지 못했습니다.',
      });
    } finally {
      try {
        if (parser) {
          await parser.destroy();
        }
      } catch {}
    }
  }
);

/* =====================================================
   상황 추천
===================================================== */

app.post(
  '/recommend-situations',
  async (req, res) => {
    try {
      const requestedCount =
        Number(req.body?.count) || 3;

      const count = Math.min(
        Math.max(requestedCount, 1),
        5
      );

      const completion =
        await openai.chat.completions.create({
          model: MODEL,

          messages: [
            {
              role: 'system',
              content: `
고등학생이 실제 생활에서 연습할 수 있는
대화 상황을 추천한다.

학교, 친구, 선생님, 전화, 발표,
조별활동 등의 상황을 사용한다.

JSON만 반환한다.

{
  "situations": [
    {
      "title": "",
      "description": "",
      "reason": ""
    }
  ]
}
`,
            },

            {
              role: 'user',
              content:
                `대화 연습 상황 ${count}개를 추천해줘.`,
            },
          ],

          response_format: {
            type: 'json_object',
          },

          temperature: 0.8,
          max_tokens: 800,
        });

      const content =
        completion.choices?.[0]?.message?.content ||
        '{}';

      const parsed = safeJsonParse(content);

      const situations =
        Array.isArray(parsed?.situations)
          ? parsed.situations.slice(0, count)
          : [];

      return res.json({
        success: true,
        situations,
      });
    } catch (error) {
      console.error(
        '상황 추천 오류:',
        error
      );

      return res.status(500).json({
        error:
          error?.message ||
          '상황을 추천하지 못했습니다.',
      });
    }
  }
);

/* =====================================================
   AI 대화
===================================================== */

app.post('/chat', async (req, res) => {
  try {
    const {
      message = '',
      conversation = '',
      situation = '',
      myRole = '학생',
      opponent = '상대방',
      difficulty = '보통',
      conversationType = '일반 대화',
      university = '',
      department = '',
      speechConcern = '',
      gender = '',
    } = req.body || {};

    const safeMessage = cleanText(
      message,
      5000
    );

    const safeConversation = cleanText(
      conversation,
      30000
    );

    const safeSituation = cleanText(
      situation,
      1000
    );

    const safeMyRole = cleanText(
      myRole,
      500
    );

    const safeOpponent = cleanText(
      opponent,
      500
    );

    const safeDifficulty = cleanText(
      difficulty,
      100
    );

    const safeConversationType = cleanText(
      conversationType,
      100
    );

    const safeUniversity = cleanText(
      university,
      500
    );

    const safeDepartment = cleanText(
      department,
      500
    );

    const safeSpeechConcern = cleanText(
      speechConcern,
      1000
    );

    const safeGender = cleanText(
      gender,
      100
    );

    const isStarting =
      safeMessage ===
      '__START_CONVERSATION__';

    if (!isStarting && !safeMessage) {
      return res.status(400).json({
        error: '대화 내용이 없습니다.',
      });
    }

    let difficultyInstruction = '';

    if (safeDifficulty === '쉬움') {
      difficultyInstruction = `
상대는 비교적 친절하고 여유롭다.
대화를 이어가기 쉽게 반응한다.
하지만 상황과 관계는 정확하게 유지한다.
`;
    } else if (
      safeDifficulty === '어려움'
    ) {
      difficultyInstruction = `
상대는 바쁘거나 무뚝뚝할 수 있다.
애매한 말에는 되물을 수 있다.
상황과 맞지 않는 말에는 어색함을 드러낼 수 있다.
억지로 공격적이거나 무례하게 만들지는 않는다.
`;
    } else {
      difficultyInstruction = `
현실적인 일반 대화처럼 반응한다.
지나치게 친절하거나 차갑지 않다.
`;
    }

    const systemPrompt = `
너는 Tongue Brake의 실제 대화 상대방이다.

반드시 "${safeOpponent}" 역할을 맡는다.

[상황]
${safeSituation}

[사용자 역할]
${safeMyRole}

[상대 역할]
${safeOpponent}

[대화 유형]
${safeConversationType}

[난이도]
${safeDifficulty}

${difficultyInstruction}

[추가 정보]
대학교: ${safeUniversity || '없음'}
학과: ${safeDepartment || '없음'}
말하기 걱정: ${safeSpeechConcern || '없음'}
성별: ${safeGender || '없음'}

[지금까지의 대화]
${safeConversation || '(없음)'}

가장 중요한 규칙:

1. 최신 발화만 보지 말고 전체 대화 맥락을 본다.
2. 현재 상황과 역할을 절대 잊지 않는다.
3. 사용자가 말하지 않은 사실을 만들지 않는다.
4. 사용자의 의도와 감정을 함부로 추측하지 않는다.
5. 이상하거나 의미 없는 말에는 이상하다고 자연스럽게 반응한다.
6. 부정적인 표현을 자동으로 상담이나 위로로 연결하지 않는다.
7. 모든 답변에 질문을 붙이지 않는다.
8. 모든 말에 긍정적으로 맞장구치지 않는다.
9. 관계에 맞지 않는 행동이나 새로운 상황을 임의로 만들지 않는다.
10. 실제 사람이 말하는 것처럼 1~3문장으로 짧게 답한다.
11. 사용자가 주제를 갑자기 바꾸면 그 사실을 자연스럽게 반영한다.
12. 모르는 사실은 추측해서 단정하지 않는다.
13. 현재 관계가 연애 관계가 아니라면 사용자의 호감 표현에 자동으로 연애 감정으로 답하지 않는다.

사용자의 최신 발화:
${safeMessage}
`;

    const completion =
      await openai.chat.completions.create({
        model: MODEL,

        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
        ],

        temperature:
          safeDifficulty === '어려움'
            ? 0.85
            : safeDifficulty === '쉬움'
            ? 0.65
            : 0.75,

        max_tokens: 300,
      });

    const reply =
      completion.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(500).json({
        error: 'AI 응답이 없습니다.',
      });
    }

    console.log('🤖 AI:', reply);

    return res.json({
      reply,
    });
  } catch (error) {
    console.error(
      '❌ /chat 오류:',
      error
    );

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : '대화 처리 중 오류가 발생했습니다.',
    });
  }
});

/* =====================================================
   대화 분석
===================================================== */

app.post(
  '/analyze',
  async (req, res) => {
    try {
      const {
        messages = '',
        situation = '',
        personality = '',
      } = req.body || {};

      const safeMessages = cleanText(
        messages,
        30000
      );

      const safeSituation = cleanText(
        situation,
        1000
      );

      const safePersonality = cleanText(
        personality,
        500
      );

      if (!safeMessages) {
        return res.status(400).json({
          error: '분석할 대화가 없습니다.',
        });
      }

      const systemPrompt = `
너는 Tongue Brake의 대화 분석 AI다.

전체 대화의 맥락을 분석한다.

[상황]
${safeSituation}

[대화 유형]
${safePersonality}

[전체 대화]
${safeMessages}

사용자만 평가하지 않는다.
AI가 맥락을 놓친 경우 반드시 AI의 문제로 구분한다.

평가 기준:

- 자연스러움
- 상황에 맞는 말투
- 상대방과의 관계
- 대화 맥락 이해
- 존중
- 어색해진 원인

사용자의 의도와 감정을 함부로 추측하지 않는다.

JSON만 반환한다.

{
  "overallScore": 0,
  "naturalScore": 0,
  "toneScore": 0,
  "respectScore": 0,
  "goodPoints": [],
  "problems": [],
  "advice": [],
  "example": ""
}

goodPoints:
실제로 잘한 점만 작성한다.

problems:
사용자 문제와 AI 문제를 구분해서 구체적으로 작성한다.

advice:
다음 대화에서 실제로 사용할 수 있는 구체적인 조언을 작성한다.

example:
현재 대화 흐름에 맞는 다음 발화 예시 하나를 작성한다.
`;

      const completion =
        await openai.chat.completions.create({
          model: MODEL,

          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },

            {
              role: 'user',
              content:
                '위 대화를 전체 맥락으로 분석해줘.',
            },
          ],

          temperature: 0.3,

          max_tokens: 1200,

          response_format: {
            type: 'json_object',
          },
        });

      const raw =
        completion.choices?.[0]?.message?.content?.trim();

      if (!raw) {
        return res.status(500).json({
          error: '분석 결과가 없습니다.',
        });
      }

      const analysis =
        JSON.parse(raw);

      analysis.overallScore =
        normalizeScore(
          analysis.overallScore
        );

      analysis.naturalScore =
        normalizeScore(
          analysis.naturalScore
        );

      analysis.toneScore =
        normalizeScore(
          analysis.toneScore
        );

      analysis.respectScore =
        normalizeScore(
          analysis.respectScore
        );

      analysis.goodPoints =
        normalizeArray(
          analysis.goodPoints
        );

      analysis.problems =
        normalizeArray(
          analysis.problems
        );

      analysis.advice =
        normalizeArray(
          analysis.advice
        );

      analysis.example =
        cleanText(
          analysis.example,
          500
        );

      return res.json({
        analysis,
        model: MODEL,
      });
    } catch (error) {
      console.error(
        '❌ /analyze 오류:',
        error
      );

      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : '대화 분석 중 오류가 발생했습니다.',
      });
    }
  }
);
// ================================
// 관리자용 실험 데이터 조회
// ================================
app.get('/experiment-data', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(
      __dirname,
      'experiment-data.json'
    );

    if (!fs.existsSync(filePath)) {
      return res.json({
        success: true,
        data: [],
      });
    }

    let data = [];

    try {
      data = JSON.parse(
        fs.readFileSync(filePath, 'utf8')
      );

      if (!Array.isArray(data)) {
        data = [];
      }
    } catch {
      data = [];
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      '실험 데이터 조회 오류:',
      error
    );

    res.status(500).json({
      success: false,
      error: '실험 데이터 조회 실패',
    });
  }
});
/* =====================================================
   서버 실행
===================================================== */

app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `🚀 Tongue Brake server running on port ${PORT}`
    );
    console.log(
      `🤖 MODEL: ${MODEL}`
    );
  }
);

// ================================
// Tongue Brake 실험 데이터 저장
// ================================

app.post('/experiment-data', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');

    const data = req.body || {};

    if (!data.participantId) {
      return res.status(400).json({
        error: 'participantId가 없습니다.',
      });
    }

    const filePath = path.join(
      __dirname,
      'experiment-data.json'
    );

    let allData = [];

    if (fs.existsSync(filePath)) {
      try {
        allData = JSON.parse(
          fs.readFileSync(filePath, 'utf8')
        );

        if (!Array.isArray(allData)) {
          allData = [];
        }
      } catch {
        allData = [];
      }
    }

    allData.push({
      ...data,
      savedAt: new Date().toISOString(),
    });

    fs.writeFileSync(
      filePath,
      JSON.stringify(allData, null, 2),
      'utf8'
    );

    console.log(
      `🧪 실험 데이터 저장: 참가자 ${data.participantId}`
    );

    res.json({
      success: true,
      message: '실험 데이터가 저장되었습니다.',
    });
  } catch (error) {
    console.error(
      '실험 데이터 저장 오류:',
      error
    );

    res.status(500).json({
      error: '실험 데이터 저장 실패',
    });
  }
});
