import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SERVER_URL } from '../config';

type Analysis = {
  overallScore: number;
  toneScore: number;
  naturalScore: number;
  respectScore: number;
  continuationScore?: number;
  responseScore?: number;
  questioningScore?: number;
  goodPoints: string[];
  problems: string[];
  advice: string[];
  example: string;
};

export default function ResultScreen() {
  const [messages, setMessages] = useState('');
  const [situation, setSituation] = useState('대화');
  const [personality, setPersonality] =
    useState('일반 대화');

  const [analysis, setAnalysis] =
    useState<Analysis | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState('');

  const analyzeConversation = async () => {
    try {
      console.log('🔎 분석 시작');

      const saved =
        await AsyncStorage.getItem(
          'tongue_brake_current_conversation'
        );

      console.log(
        '📦 저장된 대화:',
        saved
      );

      if (!saved) {
        throw new Error(
          '분석할 대화가 없습니다.'
        );
      }

      const conversation =
        JSON.parse(saved);

      const conversationText =
        String(
          conversation.messages || ''
        );

      const currentSituation =
        String(
          conversation.situation || '대화'
        );

      const currentPersonality =
        String(
          conversation.personality ||
            '일반 대화'
        );

      if (!conversationText.trim()) {
        throw new Error(
          '저장된 대화 내용이 비어 있습니다.'
        );
      }

      setMessages(
        conversationText
      );

      setSituation(
        currentSituation
      );

      setPersonality(
        currentPersonality
      );

      console.log(
        '📤 서버로 분석 요청:',
        {
          messages:
            conversationText,
          situation:
            currentSituation,
          personality:
            currentPersonality,
        }
      );

      /*
       * 중요:
       * server.js의 /analyze는
       * "messages"라는 이름을 사용한다.
       *
       * 따라서 conversation이 아니라
       * messages로 보내야 한다.
       */

      const response = await fetch(
        `${SERVER_URL}/analyze`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            messages:
              conversationText,

            situation:
              currentSituation,

            personality:
              currentPersonality,
          }),
        }
      );

      const data =
        await response.json();

      console.log(
        '📥 분석 서버 응답:',
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `분석 서버 오류 (${response.status})`
        );
      }

      const result =
        data.analysis ?? data;

      setAnalysis(result);

      await saveHistory(
        result,
        conversationText,
        currentSituation,
        currentPersonality
      );

      console.log(
        '✅ 분석 완료'
      );
    } catch (error) {
      console.error(
        '분석 오류:',
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : '분석 중 오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  const saveHistory = async (
    result: Analysis,
    conversationText: string,
    currentSituation: string,
    currentPersonality: string
  ) => {
    try {
      const saved =
        await AsyncStorage.getItem(
          'tongue_brake_history'
        );

      const history =
        saved
          ? JSON.parse(saved)
          : [];

      const item = {
        id:
          Date.now().toString(),

        date:
          new Date().toISOString(),

        situation:
          currentSituation,

        personality:
          currentPersonality,

        messages:
          conversationText,

        analysis:
          result,
      };

      await AsyncStorage.setItem(
        'tongue_brake_history',
        JSON.stringify([
          item,
          ...history,
        ])
      );

      console.log(
        '✅ 기록 저장 완료'
      );
    } catch (error) {
      console.error(
        '기록 저장 오류:',
        error
      );
    }
  };

  useEffect(() => {
    analyzeConversation();
  }, []);

  if (loading) {
    return (
      <View
        style={styles.loadingScreen}
      >
        <ActivityIndicator
          size="large"
        />

        <Text
          style={styles.loadingTitle}
        >
          대화를 분석하는 중...
        </Text>

        <Text
          style={styles.loadingText}
        >
          잠시만 기다려주세요.
        </Text>
      </View>
    );
  }

  if (!analysis) {
    return (
      <View
        style={styles.loadingScreen}
      >
        <Text
          style={styles.errorTitle}
        >
          분석 결과를 불러오지 못했습니다.
        </Text>

        <Text
          style={styles.errorMessage}
        >
          {errorMessage ||
            '알 수 없는 오류가 발생했습니다.'}
        </Text>

        <Pressable
          style={styles.homeButton}
          onPress={() => {
            router.replace('/');
          }}
        >
          <Text
            style={styles.homeButtonText}
          >
            홈으로
          </Text>
        </Pressable>
      </View>
    );
  }

  const overall =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          Number(
            analysis.overallScore || 0
          )
        )
      )
    );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          대화 분석 결과
        </Text>

        <Text style={styles.subtitle}>
          {situation}
        </Text>
      </View>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>
          종합 점수
        </Text>

        <Text style={styles.score}>
          {overall}
        </Text>

        <Text style={styles.scoreUnit}>
          / 100
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          잘한 점
        </Text>

        {analysis.goodPoints &&
        analysis.goodPoints.length >
          0 ? (
          analysis.goodPoints.map(
            (item, index) => (
              <View
                key={`good-${index}`}
                style={styles.listRow}
              >
                <Text
                  style={styles.bullet}
                >
                  •
                </Text>

                <Text
                  style={styles.listText}
                >
                  {item}
                </Text>
              </View>
            )
          )
        ) : (
          <Text
            style={styles.emptyText}
          >
            분석된 내용이 없습니다.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          아쉬운 점
        </Text>

        {analysis.problems &&
        analysis.problems.length >
          0 ? (
          analysis.problems.map(
            (item, index) => (
              <View
                key={`problem-${index}`}
                style={styles.listRow}
              >
                <Text
                  style={styles.bullet}
                >
                  •
                </Text>

                <Text
                  style={styles.listText}
                >
                  {item}
                </Text>
              </View>
            )
          )
        ) : (
          <Text
            style={styles.emptyText}
          >
            특별한 문제점이 발견되지 않았습니다.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          다음에는 이렇게
        </Text>

        {analysis.advice &&
        analysis.advice.length > 0 ? (
          analysis.advice.map(
            (item, index) => (
              <View
                key={`advice-${index}`}
                style={styles.listRow}
              >
                <Text
                  style={styles.bullet}
                >
                  •
                </Text>

                <Text
                  style={styles.listText}
                >
                  {item}
                </Text>
              </View>
            )
          )
        ) : (
          <Text
            style={styles.emptyText}
          >
            특별한 조언이 없습니다.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          추천 답변
        </Text>

        <View
          style={styles.exampleBox}
        >
          <Text
            style={styles.exampleText}
          >
            {analysis.example ||
              '추천 답변이 없습니다.'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          세부 점수
        </Text>

        <ScoreRow
          title="말투"
          value={analysis.toneScore}
        />

        <ScoreRow
          title="자연스러움"
          value={
            analysis.naturalScore
          }
        />

        <ScoreRow
          title="존중"
          value={
            analysis.respectScore
          }
        />

        <ScoreRow
          title="대화 이어가기"
          value={
            analysis.continuationScore
          }
        />

        <ScoreRow
          title="응답"
          value={
            analysis.responseScore
          }
        />

        <ScoreRow
          title="질문"
          value={
            analysis.questioningScore
          }
        />
      </View>

      <Pressable
        style={
          styles.primaryButton
        }
        onPress={() => {
          router.replace('/');
        }}
      >
        <Text
          style={
            styles.primaryButtonText
          }
        >
          다시 연습하기
        </Text>
      </Pressable>

      <Pressable
        style={
          styles.secondaryButton
        }
        onPress={() => {
          router.push('/history');
        }}
      >
        <Text
          style={
            styles.secondaryButtonText
          }
        >
          지난 기록 보기
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function ScoreRow({
  title,
  value,
}: {
  title: string;
  value?: number;
}) {
  const safeScore =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          Number(value || 0)
        )
      )
    );

  return (
    <View style={styles.scoreRow}>
      <View
        style={styles.scoreRowTop}
      >
        <Text
          style={styles.scoreRowTitle}
        >
          {title}
        </Text>

        <Text
          style={styles.scoreRowValue}
        >
          {safeScore}
        </Text>
      </View>

      <View
        style={styles.barBackground}
      >
        <View
          style={[
            styles.bar,
            {
              width: `${safeScore}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: '#F7F7F8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  loadingTitle: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: '800',
  },

  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#888888',
  },

  errorTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },

  errorMessage: {
    marginTop: 12,
    fontSize: 13,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 20,
  },

  header: {
    marginBottom: 18,
  },

  title: {
    fontSize: 25,
    fontWeight: '900',
    color: '#111111',
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    color: '#888888',
  },

  scoreCard: {
    backgroundColor: '#111111',
    borderRadius: 22,
    padding: 25,
    alignItems: 'center',
    marginBottom: 15,
  },

  scoreLabel: {
    color: '#BBBBBB',
    fontSize: 12,
    fontWeight: '700',
  },

  score: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 58,
    fontWeight: '900',
  },

  scoreUnit: {
    marginTop: -5,
    color: '#AAAAAA',
    fontSize: 12,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 13,
  },

  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 9,
  },

  bullet: {
    width: 18,
    fontSize: 15,
    color: '#555555',
  },

  listText: {
    flex: 1,
    fontSize: 13,
    color: '#333333',
    lineHeight: 20,
  },

  emptyText: {
    fontSize: 13,
    color: '#999999',
  },

  exampleBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
  },

  exampleText: {
    fontSize: 13,
    color: '#333333',
    lineHeight: 21,
  },

  scoreRow: {
    marginBottom: 15,
  },

  scoreRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },

  scoreRowTitle: {
    fontSize: 12,
    color: '#555555',
  },

  scoreRowValue: {
    fontSize: 12,
    fontWeight: '800',
  },

  barBackground: {
    height: 7,
    borderRadius: 5,
    backgroundColor: '#EEEEEE',
    overflow: 'hidden',
  },

  bar: {
    height: 7,
    borderRadius: 5,
    backgroundColor: '#111111',
  },

  homeButton: {
    marginTop: 20,
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#111111',
  },

  homeButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  primaryButton: {
    backgroundColor: '#111111',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 5,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 9,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },

  secondaryButtonText: {
    color: '#222222',
    fontSize: 14,
    fontWeight: '800',
  },
});