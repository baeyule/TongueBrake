
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SERVER_URL } from '../config';

type ExperimentData = {
  participantId?: string;
  phase?: string;
  date?: string;
  savedAt?: string;
  situation?: string;
  messages?: string;
  analysis?: {
    overallScore?: number;
    naturalScore?: number;
    toneScore?: number;
    respectScore?: number;
    goodPoints?: string[];
    problems?: string[];
    advice?: string[];
    example?: string;
  };
};

function getDay(phase?: string) {
  if (!phase) return '기타';

  const match = phase.match(/day(\d+)/i);

  if (match) {
    return `Day ${match[1]}`;
  }

  return phase;
}

function getDate(item: ExperimentData) {
  const value = item.date || item.savedAt;

  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('ko-KR');
}

function getScore(item: ExperimentData) {
  const score = item.analysis?.overallScore;

  if (typeof score !== 'number') {
    return '-';
  }

  return Math.round(score);
}

export default function AdminScreen() {
  const [data, setData] = useState<ExperimentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [participantFilter, setParticipantFilter] =
    useState('전체');
  const [dayFilter, setDayFilter] =
    useState('전체');
  const [dateFilter, setDateFilter] =
    useState('전체');
  const [selected, setSelected] =
    useState<ExperimentData | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${SERVER_URL}/experiment-data`
      );

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error ||
            '데이터를 불러오지 못했습니다.'
        );
      }

      const sorted = Array.isArray(result.data)
        ? [...result.data].reverse()
        : [];

      setData(sorted);
    } catch (err) {
      console.error(err);

      setError(
        '실험 데이터를 불러오지 못했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const participants = useMemo(() => {
    const ids = data
      .map((item) => item.participantId)
      .filter(Boolean) as string[];

    return [
      '전체',
      ...Array.from(new Set(ids)).sort(),
    ];
  }, [data]);

  const days = useMemo(() => {
    const values = data.map((item) =>
      getDay(item.phase)
    );

    return [
      '전체',
      ...Array.from(new Set(values)),
    ];
  }, [data]);

  const dates = useMemo(() => {
    const values = data
      .map((item) => getDate(item))
      .filter(Boolean);

    return [
      '전체',
      ...Array.from(new Set(values)),
    ];
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const participantMatch =
        participantFilter === '전체' ||
        item.participantId === participantFilter;

      const dayMatch =
        dayFilter === '전체' ||
        getDay(item.phase) === dayFilter;

      const dateMatch =
        dateFilter === '전체' ||
        getDate(item) === dateFilter;

      return (
        participantMatch &&
        dayMatch &&
        dateMatch
      );
    });
  }, [
    data,
    participantFilter,
    dayFilter,
    dateFilter,
  ]);

  const averageScore = useMemo(() => {
    const scores = filteredData
      .map((item) => item.analysis?.overallScore)
      .filter(
        (score): score is number =>
          typeof score === 'number'
      );

    if (!scores.length) return '-';

    const average =
      scores.reduce(
        (sum, score) => sum + score,
        0
      ) / scores.length;

    return Math.round(average);
  }, [filteredData]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          실험 데이터를 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              Tongue Brake
            </Text>

            <Text style={styles.title}>
              관리자 페이지
            </Text>

            <Text style={styles.subtitle}>
              실험 데이터를 참가자별로 확인합니다.
            </Text>
          </View>

          <Pressable
            style={styles.refreshButton}
            onPress={loadData}
          >
            <Text style={styles.refreshText}>
              새로고침
            </Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : null}

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              전체 기록
            </Text>
            <Text style={styles.summaryValue}>
              {filteredData.length}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              참가자
            </Text>
            <Text style={styles.summaryValue}>
              {participantFilter === '전체'
                ? participants.length - 1
                : 1}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              평균 점수
            </Text>
            <Text style={styles.summaryValue}>
              {averageScore}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          참가자
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <View style={styles.filterRow}>
            {participants.map((id) => (
              <Pressable
                key={id}
                style={[
                  styles.filterButton,
                  participantFilter === id &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setParticipantFilter(id)
                }
              >
                <Text
                  style={[
                    styles.filterText,
                    participantFilter === id &&
                      styles.filterTextActive,
                  ]}
                >
                  {id}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.sectionTitle}>
          Day
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <View style={styles.filterRow}>
            {days.map((day) => (
              <Pressable
                key={day}
                style={[
                  styles.filterButton,
                  dayFilter === day &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setDayFilter(day)
                }
              >
                <Text
                  style={[
                    styles.filterText,
                    dayFilter === day &&
                      styles.filterTextActive,
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.sectionTitle}>
          날짜
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <View style={styles.filterRow}>
            {dates.map((date) => (
              <Pressable
                key={date}
                style={[
                  styles.filterButton,
                  dateFilter === date &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setDateFilter(date)
                }
              >
                <Text
                  style={[
                    styles.filterText,
                    dateFilter === date &&
                      styles.filterTextActive,
                  ]}
                >
                  {date}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.resultHeader}>
          <Text style={styles.sectionTitle}>
            실험 기록
          </Text>

          <Text style={styles.countText}>
            {filteredData.length}건
          </Text>
        </View>

        {filteredData.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>
              데이터가 없습니다.
            </Text>

            <Text style={styles.emptyText}>
              선택한 참가자, Day, 날짜에 해당하는
              실험 기록이 없습니다.
            </Text>
          </View>
        ) : (
          filteredData.map((item, index) => {
            const score = getScore(item);

            return (
              <Pressable
                key={`${item.participantId}-${item.date}-${index}`}
                style={styles.dataCard}
                onPress={() =>
                  setSelected(item)
                }
              >
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.participantText}>
                      참가자 {item.participantId || '-'}
                    </Text>

                    <Text style={styles.phaseText}>
                      {getDay(item.phase)}
                    </Text>
                  </View>

                  <View style={styles.scoreBox}>
                    <Text style={styles.scoreNumber}>
                      {score}
                    </Text>

                    <Text style={styles.scoreLabel}>
                      점
                    </Text>
                  </View>
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.infoText}>
                    📅 {getDate(item) || '-'}
                  </Text>

                  <Text style={styles.infoText}>
                    💬 {item.situation || '-'}
                  </Text>
                </View>

                <Text style={styles.detailText}>
                  클릭하여 상세 데이터 보기 →
                </Text>
              </Pressable>
            );
          })
        )}

        {selected ? (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailTitle}>
                  상세 기록
                </Text>

                <Text style={styles.detailSubtitle}>
                  참가자 {selected.participantId} ·{' '}
                  {getDay(selected.phase)}
                </Text>
              </View>

              <Pressable
                onPress={() => setSelected(null)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>
                  닫기
                </Text>
              </Pressable>
            </View>

            <View style={styles.scoreGrid}>
              <ScoreItem
                title="전체"
                value={selected.analysis?.overallScore}
              />

              <ScoreItem
                title="자연스러움"
                value={selected.analysis?.naturalScore}
              />

              <ScoreItem
                title="말투"
                value={selected.analysis?.toneScore}
              />

              <ScoreItem
                title="존중"
                value={selected.analysis?.respectScore}
              />
            </View>

            <DetailSection
              title="상황"
              content={
                selected.situation || '-'
              }
            />

            <DetailSection
              title="대화 내용"
              content={
                selected.messages || '-'
              }
            />

            <DetailList
              title="잘한 점"
              items={
                selected.analysis?.goodPoints
              }
            />

            <DetailList
              title="문제점"
              items={
                selected.analysis?.problems
              }
            />

            <DetailList
              title="조언"
              items={
                selected.analysis?.advice
              }
            />

            <DetailSection
              title="추천 표현"
              content={
                selected.analysis?.example || '-'
              }
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ScoreItem({
  title,
  value,
}: {
  title: string;
  value?: number;
}) {
  return (
    <View style={styles.scoreItem}>
      <Text style={styles.scoreItemTitle}>
        {title}
      </Text>

      <Text style={styles.scoreItemValue}>
        {typeof value === 'number'
          ? Math.round(value)
          : '-'}
      </Text>
    </View>
  );
}

function DetailSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>
        {title}
      </Text>

      <Text style={styles.detailContent}>
        {content}
      </Text>
    </View>
  );
}

function DetailList({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>
        {title}
      </Text>

      {!items?.length ? (
        <Text style={styles.detailContent}>
          -
        </Text>
      ) : (
        items.map((item, index) => (
          <Text
            key={`${title}-${index}`}
            style={styles.listItem}
          >
            • {item}
          </Text>
        ))
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
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
    padding: 30,
    paddingBottom: 80,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F8',
  },

  loadingText: {
    marginTop: 15,
    color: '#666',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },

  logo: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111',
    marginBottom: 12,
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: '#777',
  },

  refreshButton: {
    backgroundColor: '#111',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
  },

  refreshText: {
    color: '#FFF',
    fontWeight: '700',
  },

  errorBox: {
    backgroundColor: '#FFF0F0',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },

  errorText: {
    color: '#B00020',
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },

  summaryLabel: {
    fontSize: 13,
    color: '#777',
    marginBottom: 8,
  },

  summaryValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
    marginBottom: 12,
    marginTop: 8,
  },

  filterScroll: {
    marginBottom: 15,
  },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },

  filterButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },

  filterButtonActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },

  filterText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '700',
  },

  filterTextActive: {
    color: '#FFF',
  },

  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
  },

  countText: {
    color: '#777',
    fontWeight: '700',
  },

  dataCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E7E7E7',
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  participantText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111',
    marginBottom: 5,
  },

  phaseText: {
    fontSize: 13,
    color: '#777',
    fontWeight: '700',
  },

  scoreBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  scoreNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111',
  },

  scoreLabel: {
    fontSize: 13,
    color: '#777',
    marginLeft: 3,
  },

  cardInfo: {
    marginTop: 15,
    gap: 7,
  },

  infoText: {
    color: '#555',
    fontSize: 14,
  },

  detailText: {
    marginTop: 15,
    color: '#777',
    fontSize: 13,
    fontWeight: '700',
  },

  emptyBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111',
    marginBottom: 8,
  },

  emptyText: {
    color: '#777',
    textAlign: 'center',
  },

  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 22,
    marginTop: 25,
    borderWidth: 2,
    borderColor: '#111',
  },

  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },

  detailTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111',
  },

  detailSubtitle: {
    marginTop: 5,
    color: '#777',
  },

  closeButton: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  closeText: {
    fontWeight: '700',
    color: '#555',
  },

  scoreGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },

  scoreItem: {
    flex: 1,
    backgroundColor: '#F7F7F8',
    borderRadius: 12,
    padding: 13,
  },

  scoreItemTitle: {
    fontSize: 12,
    color: '#777',
    marginBottom: 5,
  },

  scoreItemValue: {
    fontSize: 23,
    fontWeight: '900',
    color: '#111',
  },

  detailSection: {
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },

  detailSectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111',
    marginBottom: 9,
  },

  detailContent: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
  },

  listItem: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
    marginBottom: 4,
  },
});
