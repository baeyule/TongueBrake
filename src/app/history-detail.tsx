import { router, useLocalSearchParams } from 'expo-router';
import {
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

type HistoryItem = {
  id: string;
  date: string;
  situation: string;
  personality: string;
  messages: string;
  analysis: Analysis;
};

export default function HistoryDetailScreen() {
  const params = useLocalSearchParams();

  let item: HistoryItem | null = null;

  try {
    if (params.historyData) {
      item = JSON.parse(
        String(params.historyData)
      );
    }
  } catch (error) {
    console.error(
      '기록 불러오기 오류:',
      error
    );
  }

  if (!item || !item.analysis) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>
          ⚠️
        </Text>

        <Text style={styles.errorTitle}>
          기록을 불러올 수 없습니다.
        </Text>

        <Pressable
          style={styles.homeButton}
          onPress={() =>
            router.replace('/history')
          }
        >
          <Text style={styles.homeText}>
            기록 목록으로
          </Text>
        </Pressable>
      </View>
    );
  }

  const analysis = item.analysis;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* 헤더 */}

      <View style={styles.header}>
        <Pressable
          onPress={() =>
            router.replace('/history')
          }
        >
          <Text style={styles.back}>
            ←
          </Text>
        </Pressable>

        <Text style={styles.title}>
          대화 기록
        </Text>

        <View style={{ width: 25 }} />
      </View>

      {/* 기본 정보 */}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          {item.situation}
        </Text>

        <Text style={styles.infoText}>
          {item.personality}
        </Text>

        <Text style={styles.date}>
          {formatDate(item.date)}
        </Text>
      </View>

      {/* 종합 점수 */}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>
          종합 점수
        </Text>

        <Text style={styles.score}>
          {analysis.overallScore}
        </Text>

        <Text style={styles.scoreUnit}>
          / 100
        </Text>
      </View>

      {/* 세부 점수 */}

      <View style={styles.scoreGrid}>
        <ScoreCard
          title="말투"
          score={analysis.toneScore}
        />

        <ScoreCard
          title="자연스러움"
          score={analysis.naturalScore}
        />

        <ScoreCard
          title="배려"
          score={analysis.respectScore}
        />
      </View>

      {/* 대화 내용 */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          💬 대화 내용
        </Text>

        <Text style={styles.messages}>
          {item.messages}
        </Text>
      </View>

      {/* 잘한 점 */}

      <Section
        title="👍 잘한 점"
        items={analysis.goodPoints}
      />

      {/* 개선할 점 */}

      <Section
        title="🔧 개선할 점"
        items={analysis.problems}
      />

      {/* 연습 방법 */}

      <Section
        title="💡 연습 방법"
        items={analysis.advice}
      />

      {/* 예시 */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          ✨ 이렇게 말해볼 수도 있어요
        </Text>

        <Text style={styles.example}>
          {analysis.example}
        </Text>
      </View>

      {/* 처음으로 */}

      <Pressable
        style={styles.homeButton}
        onPress={() =>
          router.replace('/')
        }
      >
        <Text style={styles.homeText}>
          처음으로
        </Text>
      </Pressable>

      {/* 기록 목록 */}

      <Pressable
        style={styles.listButton}
        onPress={() =>
          router.replace('/history')
        }
      >
        <Text style={styles.listText}>
          기록 목록으로
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleString(
      'ko-KR'
    );
  } catch {
    return '';
  }
}

function ScoreCard({
  title,
  score,
}: {
  title: string;
  score: number;
}) {
  return (
    <View style={styles.scoreCard}>
      <Text style={styles.scoreCardTitle}>
        {title}
      </Text>

      <Text style={styles.scoreCardNumber}>
        {score}
      </Text>
    </View>
  );
}

function Section({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      {items && items.length > 0 ? (
        items.map((item, index) => (
          <View
            key={`${index}-${item}`}
            style={styles.item}
          >
            <Text style={styles.bullet}>
              •
            </Text>

            <Text style={styles.itemText}>
              {item}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>
          내용이 없습니다.
        </Text>
      )}
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

  errorEmoji: {
    fontSize: 42,
    marginBottom: 15,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 25,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  back: {
    fontSize: 25,
  },

  title: {
    fontSize: 23,
    fontWeight: '800',
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 12,
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: '800',
  },

  infoText: {
    marginTop: 5,
    fontSize: 13,
    color: '#777777',
  },

  date: {
    marginTop: 8,
    fontSize: 11,
    color: '#AAAAAA',
  },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  summaryLabel: {
    color: '#888888',
    fontSize: 13,
    fontWeight: '600',
  },

  score: {
    fontSize: 58,
    fontWeight: '900',
    marginTop: 5,
  },

  scoreUnit: {
    color: '#999999',
    fontSize: 13,
  },

  scoreGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  scoreCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 17,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  scoreCardTitle: {
    color: '#777777',
    fontSize: 12,
  },

  scoreCardNumber: {
    fontSize: 25,
    fontWeight: '800',
    marginTop: 5,
  },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },

  messages: {
    color: '#555555',
    fontSize: 14,
    lineHeight: 22,
  },

  item: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  bullet: {
    width: 15,
    color: '#777777',
  },

  itemText: {
    flex: 1,
    color: '#555555',
    lineHeight: 20,
    fontSize: 13,
  },

  emptyText: {
    color: '#999999',
    fontSize: 13,
  },

  example: {
    color: '#555555',
    lineHeight: 21,
    fontSize: 14,
  },

  homeButton: {
    backgroundColor: '#111111',
    borderRadius: 13,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 25,
  },

  homeText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  listButton: {
    alignItems: 'center',
    paddingVertical: 15,
  },

  listText: {
    color: '#777777',
    fontWeight: '600',
  },
});