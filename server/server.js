require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const OpenAI = require('openai');

const app = express();

const PORT = 3000;
const MODEL =
  process.env.OPENAI_MODEL ||
  'gpt-4o-mini';

if (!process.env.OPENAI_API_KEY) {
  console.error(
    'OPENAI_API_KEY가 없습니다.'
  );

  process.exit(1);
}

const openai = new OpenAI({
  apiKey:
    process.env.OPENAI_API_KEY,
});

app.use(cors());

app.use(
  express.json({
    limit: '20mb',
  })
);

const upload = multer({
  storage:
    multer.memoryStorage(),

  limits: {
    fileSize:
      20 * 1024 * 1024,
  },
});

// ========================================
// 서버 확인
// ========================================

app.get('/', (req, res) => {
  res.json({
    message:
      'Tongue Brake server is running.',

    appName:
      'Tongue Brake',

    model: MODEL,

    pdfUpload: true,

    situationRecommendation:
      true,
  });
});

// ========================================
// PDF 읽기
// ========================================

app.post(
  '/upload-pdf',
  upload.single('file'),
  async (req, res) => {
    let parser = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          error:
            'PDF 파일이 업로드되지 않았습니다.',
        });
      }

      if (
        req.file.size === 0
      ) {
        return res.status(400).json({
          error:
            'PDF 파일의 크기가 0입니다.',
        });
      }

      console.log('');
      console.log(
        '========== PDF =========='
      );

      console.log(
        '파일:',
        req.file.originalname
      );

      console.log(
        '크기:',
        req.file.size
      );

      parser =
        new PDFParse({
          data:
            req.file.buffer,
        });

      const pdfData =
        await parser.getText();

      const text =
        String(
          pdfData?.text || ''
        ).trim();

      if (!text) {
        return res.status(400).json({
          error:
            'PDF에서 텍스트를 읽을 수 없습니다. 스캔 이미지 PDF일 가능성이 있습니다.',
        });
      }

      console.log(
        '페이지:',
        pdfData?.total ||
          pdfData?.numpages ||
          0
      );

      console.log(
        '텍스트:',
        text.length,
        '자'
      );

      console.log(
        '=========================='
      );

      return res.json({
        success: true,

        filename:
          req.file.originalname,

        pages:
          pdfData?.total ||
          pdfData?.numpages ||
          0,

        text,
      });
    } catch (error) {
      console.error(
        'PDF 오류:',
        error
      );

      return res.status(500).json({
        error:
          error?.message ||
          'PDF를 읽는 중 오류가 발생했습니다.',
      });
    } finally {
      if (parser) {
        try {
          await parser.destroy();
        } catch {}
      }
    }
  }
);

// ========================================
// AI 상황 추천
// ========================================

app.post(
  '/recommend-situations',
  async (req, res) => {
    try {
      const count = Math.min(
        Number(
          req.body?.count || 3
        ),
        5
      );

      const prompt = `
너는 Tongue Brake의 대화 연습 상황 추천 AI다.

고등학생이 실제 생활에서 대화를 연습할 수 있는
현실적인 상황을 추천해라.

너무 뻔하거나 비현실적인 상황은 피한다.

좋은 상황의 예:
- 처음 만난 사람과 대화하기
- 조별과제에서 의견 내기
- 친구에게 부탁하기
- 선생님께 질문하기
- 친구와 의견이 다를 때
- 어색한 침묵 이어가기
- 전화로 문의하기
- 발표 후 질문 받기
- 면접
- 동아리 선배에게 말 걸기

각 상황은 서로 다른 대화 능력을 연습할 수 있어야 한다.

다음 JSON만 반환한다.

{
  "recommendations": [
    {
      "title": "상황 이름",
      "description": "어떤 대화인지 한 문장",
      "reason": "왜 지금 연습하면 좋은지 한 문장"
    }
  ]
}

추천 개수:
${count}
`;

      const response =
        await openai.chat.completions.create({
          model: MODEL,

          messages: [
            {
              role: 'system',
              content:
                '너는 Tongue Brake의 상황 추천 전문가다. JSON만 반환한다.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],

          temperature: 0.8,

          max_tokens: 500,

          response_format: {
            type: 'json_object',
          },
        });

      const content =
        response
          .choices?.[0]
          ?.message
          ?.content
          ?.trim();

      if (!content) {
        throw new Error(
          '상황 추천 결과가 없습니다.'
        );
      }

      const parsed =
        JSON.parse(content);

      const recommendations =
        Array.isArray(
          parsed?.recommendations
        )
          ? parsed.recommendations
              .slice(0, count)
              .map((item) => ({
                title: String(
                  item?.title ||
                    ''
                ).trim(),

                description:
                  String(
                    item?.description ||
                      ''
                  ).trim(),

                reason:
                  String(
                    item?.reason ||
                      ''
                  ).trim(),
              }))
              .filter(
                (item) =>
                  item.title
              )
          : [];

      return res.json({
        recommendations,
      });
    } catch (error) {
      console.error(
        '상황 추천 오류:',
        error
      );

      return res.status(
        error?.status || 500
      ).json({
        error:
          error?.message ||
          '상황 추천에 실패했습니다.',
      });
    }
  }
);

// ========================================
// AI 대화
// ========================================

app.post(
  '/chat',
  async (req, res) => {
    try {
      const {
        message,
        myRole,
        opponent,
        situation,
        difficulty,
        conversationType,
        university,
        department,
        speechConcern,
        gender,
        documentText,
        conversation,
      } = req.body;

      const userMessage =
        String(
          message || ''
        ).trim();

      const transcript =
        String(
          conversation || ''
        ).trim();

      const pdfText =
        String(
          documentText || ''
        ).trim();

      if (
        !userMessage &&
        !transcript
      ) {
        return res.status(400).json({
          error:
            '대화 내용이 없습니다.',
        });
      }

      const systemPrompt = `
너는 Tongue Brake의 실제 대화 상대다.

사용자가 실제 상황에서 대화를 연습할 수 있도록
상황 속 사람처럼 행동한다.

너는 상담사도 아니고,
대화 코치도 아니고,
AI 비서도 아니다.

절대로 AI라는 사실을 대화 안에서 언급하지 않는다.

================================
[기본 설정]
================================

사용자 역할:
${myRole || '학생'}

상대방 역할:
${opponent || '친구'}

상황:
${situation || '일상적인 대화'}

대화 유형:
${conversationType || '일반 대화'}

난이도:
${difficulty || '보통'}

학교:
${university || '없음'}

학과:
${department || '없음'}

말하기 고민:
${speechConcern || '없음'}

상대방 성별:
${gender || '설정되지 않음'}

================================
[발표 PDF]
================================

${
  pdfText
    ? `
사용자가 발표 후 질문 연습을 위해 업로드한
발표 자료의 실제 텍스트다.

----------------------------
${pdfText}
----------------------------

이 자료를 실제 발표 자료로 간주한다.

발표 후 질문 상황에서는 반드시 이 자료를
근거로 질문한다.

특히 다음 내용을 찾아 활용한다.

- 발표 주제
- 핵심 주장
- 주요 개념
- 사례
- 수치
- 비교
- 결과
- 근거
- 한계
- 발표자가 주장한 내용

PDF에 없는 내용을
PDF에 있다고 말하지 않는다.

PDF의 내용을 단순히 요약하는 것이 아니라
실제 발표를 들은 사람이 궁금해할 만한 질문을 만든다.
`
    : `
현재 발표 PDF가 없다.
`
}

================================
[이전 대화]
================================

${
  transcript
    ? `
지금까지 실제로 나눈 대화:

----------------------------
${transcript}
----------------------------

이전 대화를 반드시 기억하고
사용자의 가장 최근 말에 자연스럽게 반응한다.
`
    : `
아직 대화가 시작되지 않았다.
`
}

================================
[대화 원칙]
================================

1. 실제 사람처럼 말한다.

2. 사용자의 직전 발화를 직접 반영한다.

3. 이전 대화의 내용을 기억한다.

4. 같은 질문을 반복하지 않는다.

5. 매번 질문으로 끝내지 않는다.

6. 질문은 필요할 때만 한다.

7. 질문을 한다면 한 번에 하나만 한다.

8. 사용자가 짧게 답하면 너무 길게 말하지 않는다.

9. 사용자가 이야기를 확장하면 그 흐름을 따라간다.

10. 사용자가 화제를 바꾸면 자연스럽게 따라간다.

11. 지나치게 친절하고 완벽한 AI처럼 말하지 않는다.

12. 실제 한국어 대화처럼 자연스럽게 말한다.

13. 행동 지문을 쓰지 않는다.

14. 괄호 안의 행동 설명을 쓰지 않는다.

15. 별표 행동 표현을 쓰지 않는다.

16. 설명이나 분석을 하지 않는다.

17. 상대방의 실제 대사만 출력한다.

================================
[발표 후 질문 특별 규칙]
================================

상황이 발표 후 질문이라면 특히 중요하다.

첫 질문:
PDF에서 구체적인 내용을 하나 골라 질문한다.

그 다음 질문:
사용자의 답변을 확인하고,
그 답변과 PDF 내용이 연결되는 지점을 이용한다.

사용자가 발표 내용에 대해 답하면
그 답변의 논리, 근거, 사례 또는 한계를
더 깊게 물어볼 수 있다.

단순히 PDF 내용을 반복해서 질문하지 않는다.

예:

좋지 않은 질문:
"발표에서 무엇을 설명했나요?"

좋은 질문:
"발표에서 A가 B에 영향을 준다고 했는데,
그 관계가 나타나는 가장 큰 이유는 뭐라고 생각하나요?"

더 좋은 흐름:
1. PDF의 구체적 내용 질문
2. 사용자의 답변 확인
3. 답변에서 부족하거나 흥미로운 부분 질문
4. 발표의 다른 근거 또는 사례로 연결

질문은 실제 청중이 발표를 듣고 궁금해서
물어보는 것처럼 만들어라.

================================
[면접]
================================

실제 면접관처럼 질문한다.

질문을 한 번에 하나씩 한다.

사용자의 답변에 따라
다음 질문의 방향을 바꾼다.

================================
[처음 만난 사람]
================================

처음 만난 사람처럼 행동한다.

너무 사적인 개인정보를 묻지 않는다.

공통 관심사나 현재 상황을 이용해서
자연스럽게 대화를 이어간다.

================================
[친구]
================================

실제 친구처럼 반응한다.

친구가 할 법한 짧은 반응과 질문을 사용한다.

================================
[선생님]
================================

실제 선생님처럼 행동한다.

학생이 질문하거나 상담하는 상황에 맞게 반응한다.

================================
[난이도]
================================

쉬움:
상대가 대화를 이어가기 쉽게 반응한다.

보통:
실제 사람처럼 자연스럽게 반응한다.

어려움:
짧은 반응이나 관심이 적은 반응도 사용할 수 있다.

단, 대화를 일부러 불가능하게 만들지는 않는다.

================================

중요:
사용자의 실제 말에 반응한다.

교과서 같은 대사를 피한다.

상담사 같은 표현을 피한다.

대화 연습이라는 사실을 말하지 않는다.

오직 상대방의 실제 대사만 출력한다.
`;

      const response =
        await openai.chat.completions.create({
          model: MODEL,

          messages: [
            {
              role: 'system',
              content:
                systemPrompt,
            },

            {
              role: 'user',
              content:
                userMessage ||
                '대화를 자연스럽게 시작해줘.',
            },
          ],

          temperature: 0.85,

          max_tokens: 250,
        });

      const reply =
        response
          .choices?.[0]
          ?.message
          ?.content
          ?.trim();

      if (!reply) {
        return res.status(500).json({
          error:
            'AI가 빈 응답을 반환했습니다.',
        });
      }

      return res.json({
        reply,
        model: MODEL,
      });
    } catch (error) {
      console.error(
        'CHAT ERROR:',
        error
      );

      return res.status(
        error?.status || 500
      ).json({
        error:
          error?.message ||
          'AI 응답을 생성하지 못했습니다.',

        code:
          error?.code ||
          'UNKNOWN_ERROR',
      });
    }
  }
);

// ========================================
// 대화 분석
// ========================================

app.post(
  '/analyze',
  async (req, res) => {
    try {
      const {
        messages,
        situation,
        personality,
      } = req.body;

      if (!messages) {
        return res.status(400).json({
          error:
            '분석할 대화가 없습니다.',
        });
      }

      const prompt = `
너는 Tongue Brake의 대화 분석 전문가다.

아래 실제 대화를 분석하고,
사용자가 다음 대화에서 바로 적용할 수 있는
핵심 피드백을 만들어라.

상황:
${situation || '일상적인 대화'}

대화 유형:
${personality || '일반 대화'}

대화:
${messages}

================================
분석 원칙
================================

사용자의 말만 따로 보지 말고
상대방의 말과 사용자의 반응을 함께 본다.

특히:

- 상대방의 말을 받아줬는가
- 상대의 말과 관련된 반응을 했는가
- 질문과 자기 이야기의 균형
- 대화를 이어갈 내용이 있었는가
- 너무 짧거나 일방적인 답변이 있었는가
- 갑작스러운 화제 전환이 있었는가
- 말투가 상황에 적절했는가
- 상대에게 부담을 줄 표현이 있었는가
- 자연스럽게 대화가 발전했는가

모든 항목을 억지로 문제 삼지 않는다.

================================
가장 중요한 것
================================

문제점을 많이 찾지 마라.

"다음 대화에서 무엇 하나만 바꾸면
가장 좋아지는가?"
를 찾아라.

goodPoints:
실제 대화에서 확인되는 장점 1~2개.

problems:
가장 중요한 개선점 1개.
가능하면 실제 발화를 근거로 설명한다.

advice:
사용자가 바로 연습할 수 있는 행동 1개.

example:
실제 다음 대화에서 사용할 수 있는
자연스러운 대안 문장 1개.

점수보다 피드백의 구체성이 중요하다.

문제점이 거의 없다면 억지로 만들지 않는다.

================================
JSON
================================

반드시 아래 구조의 JSON만 반환한다.

{
  "overallScore": 0,
  "toneScore": 0,
  "naturalScore": 0,
  "respectScore": 0,
  "goodPoints": [],
  "problems": [],
  "advice": [],
  "example": ""
}

점수는 모두 0~100.

JSON 이외의 문장은 반환하지 않는다.
`;

      const response =
        await openai.chat.completions.create({
          model: MODEL,

          messages: [
            {
              role: 'system',
              content:
                'Tongue Brake 대화 분석 전문가다. 유효한 JSON만 출력한다.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],

          temperature: 0.25,

          max_tokens: 700,

          response_format: {
            type: 'json_object',
          },
        });

      let content =
        response
          .choices?.[0]
          ?.message
          ?.content
          ?.trim();

      if (!content) {
        throw new Error(
          '분석 결과가 비어 있습니다.'
        );
      }

      content =
        content
          .replace(
            /^```json\s*/i,
            ''
          )
          .replace(
            /^```\s*/i,
            ''
          )
          .replace(
            /\s*```$/i,
            ''
          )
          .trim();

      let analysis =
        JSON.parse(content);

      const score = (
        value
      ) => {
        const n =
          Number(value);

        if (
          !Number.isFinite(n)
        ) {
          return 0;
        }

        return Math.max(
          0,
          Math.min(
            100,
            Math.round(n)
          )
        );
      };

      const array = (
        value,
        fallback
      ) => {
        if (
          !Array.isArray(value)
        ) {
          return fallback;
        }

        return value
          .map((item) =>
            String(
              item || ''
            ).trim()
          )
          .filter(Boolean);
      };

      analysis = {
        overallScore:
          score(
            analysis.overallScore
          ),

        toneScore:
          score(
            analysis.toneScore
          ),

        naturalScore:
          score(
            analysis.naturalScore
          ),

        respectScore:
          score(
            analysis.respectScore
          ),

        goodPoints:
          array(
            analysis.goodPoints,
            [
              '상대방과 대화를 이어가려는 시도가 있었어요.',
            ]
          ).slice(0, 2),

        problems:
          array(
            analysis.problems,
            [
              '특별히 크게 어색한 부분은 없었어요.',
            ]
          ).slice(0, 1),

        advice:
          array(
            analysis.advice,
            [
              '상대의 말에 반응한 뒤 자신의 이야기를 이어가 보세요.',
            ]
          ).slice(0, 1),

        example:
          String(
            analysis.example ||
              '상대방이 한 말에서 하나를 골라 자연스럽게 이어가 보세요.'
          ).trim(),
      };

      return res.json({
        analysis,
        model: MODEL,
      });
    } catch (error) {
      console.error(
        'ANALYZE ERROR:',
        error
      );

      return res.status(
        error?.status || 500
      ).json({
        error:
          error?.message ||
          '대화 분석에 실패했습니다.',

        code:
          error?.code ||
          'UNKNOWN_ERROR',
      });
    }
  }
);

// ========================================
// 서버 실행
// ========================================

app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log('');
    console.log(
      '===================================='
    );

    console.log(
      '        Tongue Brake Server'
    );

    console.log(
      '===================================='
    );

    console.log(
      `Server: http://localhost:${PORT}`
    );

    console.log(
      `Network: http://0.0.0.0:${PORT}`
    );

    console.log(
      `Model: ${MODEL}`
    );

    console.log(
      'PDF Upload: ENABLED'
    );

    console.log(
      'Situation Recommendation: ENABLED'
    );

    console.log(
      'Chat: ENABLED'
    );

    console.log(
      'Analysis: ENABLED'
    );

    console.log(
      '===================================='
    );

    console.log('');
  }
);