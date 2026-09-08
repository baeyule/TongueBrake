import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const SERVER_URL = 'http://10.243.27.137:3000';

type RecommendedSituation = {
  title: string;
  description: string;
  reason: string;
};

export default function HomeScreen() {
  const [recommendations, setRecommendations] = useState<
    RecommendedSituation[]
  >([]);
  const [loading, setLoading] = useState(false);

  const startPractice = () => {
    router.push('/setup');
  };

  const openHistory = () => {
    router.push('/history');
  };

  const openSettings = () => {
    router.push('/settings');
  };

  const getRecommendations = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `${SERVER_URL}/recommend-situations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            count: 3,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || '상황 추천에 실패했습니다.'
        );
      }

      if (Array.isArray(data?.recommendations)) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('상황 추천 오류:', error);

      // 서버에 문제가 있어도 앱에서 기본 추천은 보여준다.
      setRecommendations([
        {
          title: '처음 만난 사람과 대화하기',
          description:
            '처음 만난 사람과 어색하지 않게 대화를 이어가는 연습',
          reason:
            '일상에서 자주 마주치는 상황이라 기본 대화 연습에 좋아요.',
        },
        {
          title: '조별과제에서 의견 내기',
          description:
            '자신의 의견을 말하면서 다른 사람의 의견도 받아주는 연습',
          reason:
            '의견을 자연스럽게 제시하고 대화를 이어가는 연습에 좋아요.',
        },
        {
          title: '친구와 의견이 다를 때',
          description:
            '내 의견을 말하면서 상대방의 입장도 고려하는 연습',
          reason:
            '갈등을 키우지 않고 대화를 이어가는 연습에 좋아요.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const selectRecommendation = (
    recommendation: RecommendedSituation
  ) => {
    router.push(
      `/setup?situation=${encodeURIComponent(
        recommendation.title
      )}` as any
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.topBar}>
        <View>
          <Text style={styles.logo}>Tongue Brake</Text>

          <Text style={styles.tagline}>
            대화를 연습하고,
            {'\n'}
            더 자연스럽게 말해보세요.
          </Text>
        </View>

        <Pressable
          style={styles.settingsButton}
          onPress={openSettings}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.mainButton}
        onPress={startPractice}
      >
        <View>
          <Text style={styles.mainButtonTitle}>
            대화 연습 시작
          </Text>

          <Text style={styles.mainButtonDescription}>
            원하는 상황을 골라 AI와 대화해보세요
          </Text>
        </View>

        <Text style={styles.mainArrow}>→</Text>
      </Pressable>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            오늘의 연습 상황
          </Text>

          <Text style={styles.sectionDescription}>
            지금 연습하면 좋은 상황을 AI가 골라줘요
          </Text>
        </View>

        <Pressable
          style={styles.refreshButton}
          onPress={getRecommendations}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text style={styles.refreshText}>추천</Text>
          )}
        </Pressable>
      </View>

      {recommendations.length === 0 ? (
        <View style={styles.emptyRecommendation}>
          <Text style={styles.emptyEmoji}>🎯</Text>

          <Text style={styles.emptyTitle}>
            오늘은 어떤 대화를 연습할까요?
          </Text>

          <Text style={styles.emptyText}>
            버튼을 누르면 지금 연습하기 좋은
            {'\n'}
            대화 상황을 추천해드려요.
          </Text>

          <Pressable
            style={styles.recommendButton}
            onPress={getRecommendations}
          >
            <Text style={styles.recommendButtonText}>
              상황 추천받기
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.recommendationList}>
          {recommendations.map(
            (recommendation, index) => (
              <Pressable
                key={`${recommendation.title}-${index}`}
                style={styles.recommendationCard}
                onPress={() =>
                  selectRecommendation(
                    recommendation
                  )
                }
              >
                <View style={styles.numberCircle}>
                  <Text style={styles.numberText}>
                    {index + 1}
                  </Text>
                </View>

                <View style={styles.recommendationBody}>
                  <Text style={styles.recommendationTitle}>
                    {recommendation.title}
                  </Text>

                  <Text
                    style={styles.recommendationDescription}
                  >
                    {recommendation.description}
                  </Text>

                  <Text style={styles.reason}>
                    {recommendation.reason}
                  </Text>
                </View>

                <Text style={styles.cardArrow}>
                  →
                </Text>
              </Pressable>
            )
          )}
        </View>
      )}

      <Pressable
        style={styles.historyCard}
        onPress={openHistory}
      >
        <View>
          <Text style={styles.historyTitle}>
            📊 대화 기록
          </Text>

          <Text style={styles.historyDescription}>
            지난 연습 결과와 피드백을 확인해보세요.
          </Text>
        </View>

        <Text style={styles.cardArrow}>→</Text>
      </Pressable>

      <Text style={styles.footer}>
        Tongue Brake
      </Text>
    </ScrollView>
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

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 15,
    marginBottom: 35,
  },

  logo: {
    fontSize: 25,
    fontWeight: '900',
    color: '#111111',
  },

  tagline: {
    marginTop: 12,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: '#333333',
  },

  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  settingsIcon: {
    fontSize: 20,
  },

  mainButton: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  mainButtonTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },

  mainButtonDescription: {
    color: '#BBBBBB',
    fontSize: 12,
    marginTop: 7,
  },

  mainArrow: {
    color: '#FFFFFF',
    fontSize: 27,
  },

  sectionHeader: {
    marginTop: 32,
    marginBottom: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#222222',
  },

  sectionDescription: {
    marginTop: 4,
    fontSize: 11,
    color: '#999999',
  },

  refreshButton: {
    minWidth: 60,
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  refreshText: {
    fontSize: 12,
    fontWeight: '700',
  },

  emptyRecommendation: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  emptyEmoji: {
    fontSize: 30,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  emptyText: {
    marginTop: 8,
    color: '#888888',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },

  recommendButton: {
    marginTop: 18,
    backgroundColor: '#111111',
    borderRadius: 11,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },

  recommendButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  recommendationList: {
    gap: 10,
  },

  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  numberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  numberText: {
    fontSize: 12,
    fontWeight: '800',
  },

  recommendationBody: {
    flex: 1,
  },

  recommendationTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  recommendationDescription: {
    marginTop: 5,
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
  },

  reason: {
    marginTop: 6,
    fontSize: 11,
    color: '#999999',
  },

  cardArrow: {
    fontSize: 20,
    color: '#999999',
    marginLeft: 10,
  },

  historyCard: {
    marginTop: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  historyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  historyDescription: {
    marginTop: 5,
    color: '#999999',
    fontSize: 11,
  },

  footer: {
    textAlign: 'center',
    color: '#BBBBBB',
    fontSize: 11,
    marginTop: 35,
  },
});