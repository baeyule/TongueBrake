import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Analysis = {
  overallScore: number;
  toneScore: number;
  naturalScore: number;
  respectScore: number;
  goodPoints: string[];
  problems: string[];
  advice: string[];
  example: string;
};

const SERVER_URL = 'http://10.243.27.137:3000';

const HISTORY_KEY =
  'tongue_brake_history';

const OLD_HISTORY_KEY =
  'socialsim_history';

export default function ResultScreen() {
  const params =
    useLocalSearchParams();

  const messages = String(
    params.messages || ''
  );

  const situation = String(
    params.situation ||
      '일상적인 대화'
  );

  const personality = String(
    params.personality ||
      '일반 대화'
  );

  const [analysis, setAnalysis] =
    useState<Analysis | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const analyze = async () => {
    setLoading(true);
    setError('');

    try {
      if (!messages.trim()) {
        throw new Error(
          '분석할 대화 내용이 없습니다.'
        );
      }

      const response =
        await fetch(
          `${SERVER_URL}/analyze`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              messages,
              situation,
              personality,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `분석 서버 오류 (${response.status})`
        );
      }

      if (!data?.analysis) {
        throw new Error(
          '분석 결과를 받지 못했습니다.'
        );
      }

      const result: Analysis =
        data.analysis;

      setAnalysis(result);

      await saveHistory(result);
    } catch (error) {
      console.error(
        '분석 오류:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : '분석에 실패했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  const saveHistory = async (
    result: Analysis
  ) => {
    try {
      const newItem = {
        id:
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        date:
          new Date().toISOString(),

        situation,

        personality,

        messages,

        analysis: result,
      };

      const current =
        await AsyncStorage.getItem(
          HISTORY_KEY
        );

      let history =
        current
          ? JSON.parse(current)
          : [];

      if (!Array.isArray(history)) {
        history = [];
      }

      history = [
        newItem,
        ...history,
      ];

      await AsyncStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history)
      );
    } catch (error) {
      console.error(
        '기록 저장 오류:',
        error
      );
    }
  };

  useEffect(() => {
    analyze();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingTitle}>
          대화를 분석하는 중...
        </Text>

        <Text style={styles.loadingText}>
          실제 대화 흐름을 확인하고 있어요.
        </Text>
      </View>
    );
  }

  if (
    error ||
    !analysis
  ) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>
          ⚠️
        </Text>

        <Text style={styles.errorTitle}>
          분석에 실패했습니다.
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={analyze}
        >
          <Text style={styles.retryText}>
            다시 분석하기
          </Text>
        </Pressable>

        <Pressable
          style={styles.backButton}
          onPress={() =>
            router.replace('/')
          }
        >
          <Text style={styles.backText}>
            홈으로
          </Text>
        </Pressable>
      </View>
    );
  }

  const mainProblem =
    analysis.problems?.[0] ||
    '특별히 크게 어색한 부분은 없었어요.';

  const mainAdvice =
    analysis.advice?.[0] ||
    '지금처럼 상대의 말에 반응하면서 대화를 이어가 보세요.';

  const example =
    analysis.example ||
    '상대방이 한 말에서 한 가지를 골라 자연스럽게 이어가 보세요.';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            router.replace('/')
          }
        >
          <Text style={styles.back}>
            ←
          </Text>
        </Pressable>

        <Text style={styles.title}>
          대화 분석
        </Text>

        <View style={{ width: 28 }} />
      </View>

      <Text style={styles.situation}>
        {situation}
      </Text>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>
          이번 대화
        </Text>

        <Text style={styles.score}>
          {analysis.overallScore}
        </Text>

        <Text style={styles.scoreUnit}>
          / 100
        </Text>
      </View>

      <View style={styles.feedbackCard}>
        <Text style={styles.cardTitle}>
          🎯 핵심 피드백
        </Text>

        <Text style={styles.feedbackLabel}>
          잘한 점
        </Text>

        <Text style={styles.feedbackText}>
          {analysis.goodPoints?.[0] ||
            '상대와 대화를 이어가려는 시도가 있었어요.'}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.feedbackLabel}>
          다음엔 이것만
        </Text>

        <Text style={styles.feedbackText}>
          {mainProblem}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.feedbackLabel}>
          연습 방법
        </Text>

        <Text style={styles.feedbackText}>
          {mainAdvice}
        </Text>
      </View>

      <View style={styles.exampleCard}>
        <Text style={styles.cardTitle}>
          💬 이렇게 말해볼 수도 있어요
        </Text>

        <Text style={styles.example}>
          {example}
        </Text>
      </View>

      <Text style={styles.detailTitle}>
        세부 점수
      </Text>

      <View style={styles.detailCard}>
        <ScoreRow
          title="말투"
          score={analysis.toneScore}
        />

        <ScoreRow
          title="자연스러움"
          score={analysis.naturalScore}
        />

        <ScoreRow
          title="배려"
          score={analysis.respectScore}
        />
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={() =>
          router.push('/setup')
        }
      >
        <Text style={styles.primaryText}>
          다시 연습하기
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() =>
          router.push('/history')
        }
      >
        <Text style={styles.secondaryText}>
          기록 보기
        </Text>
      </Pressable>

      <Pressable
        style={styles.homeButton}
        onPress={() =>
          router.replace('/')
        }
      >
        <Text style={styles.homeText}>
          홈으로
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function ScoreRow({
  title,
  score,
}: {
  title: string;
  score: number;
}) {
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreRowTitle}>
        {title}
      </Text>

      <View style={styles.barBackground}>
        <View
          style={[
            styles.bar,
            {
              width: `${Math.max(
                0,
                Math.min(
                  100,
                  score || 0
                )
              )}%`,
            },
          ]}
        />
      </View>

      <Text style={styles.scoreRowNumber}>
        {score}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },

  content: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    padding: 24,
    paddingBottom: 60,
  },

  center: {
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
    marginTop: 7,
    color: '#888888',
    fontSize: 12,
  },

  errorEmoji: {
    fontSize: 42,
  },

  errorTitle: {
    marginTop: 15,
    fontSize: 20,
    fontWeight: '800',
  },

  errorText: {
    marginTop: 12,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 20,
  },

  retryButton: {
    marginTop: 25,
    backgroundColor: '#111111',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  backButton: {
    padding: 15,
  },

  backText: {
    color: '#777777',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  back: {
    fontSize: 27,
  },

  title: {
    fontSize: 22,
    fontWeight: '900',
  },

  situation: {
    marginTop: 25,
    textAlign: 'center',
    color: '#888888',
    fontSize: 12,
  },

  scoreCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 27,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  scoreLabel: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '700',
  },

  score: {
    marginTop: 4,
    fontSize: 57,
    fontWeight: '900',
  },

  scoreUnit: {
    color: '#AAAAAA',
    fontSize: 12,
  },

  feedbackCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 15,
  },

  feedbackLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#999999',
    marginBottom: 5,
  },

  feedbackText: {
    fontSize: 13,
    color: '#444444',
    lineHeight: 20,
  },

  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 14,
  },

  exampleCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  example: {
    color: '#555555',
    fontSize: 14,
    lineHeight: 21,
  },

  detailTitle: {
    marginTop: 25,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: '800',
  },

  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 17,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 7,
  },

  scoreRowTitle: {
    width: 65,
    fontSize: 12,
    color: '#666666',
  },

  barBackground: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EEEEEE',
    overflow: 'hidden',
  },

  bar: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#222222',
  },

  scoreRowNumber: {
    width: 35,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '800',
  },

  primaryButton: {
    marginTop: 25,
    backgroundColor: '#111111',
    borderRadius: 13,
    paddingVertical: 15,
    alignItems: 'center',
  },

  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  secondaryButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },

  secondaryText: {
    color: '#555555',
    fontWeight: '700',
  },

  homeButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },

  homeText: {
    color: '#AAAAAA',
    fontSize: 12,
  },
});