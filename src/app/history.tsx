import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  router,
  useFocusEffect,
} from 'expo-router';
import {
  useCallback,
  useState,
} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const HISTORY_KEY =
  'tongue_brake_history';

const OLD_HISTORY_KEY =
  'socialsim_history';

type HistoryItem = {
  id: string;
  date: string;
  situation: string;
  personality: string;
  messages: string;
  pdfName?: string;

  analysis: {
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
};

export default function HistoryScreen() {
  const [history, setHistory] =
    useState<HistoryItem[]>(
      []
    );

  const loadHistory =
    useCallback(
      async () => {
        try {
          let saved =
            await AsyncStorage.getItem(
              HISTORY_KEY
            );

          if (!saved) {
            const oldSaved =
              await AsyncStorage.getItem(
                OLD_HISTORY_KEY
              );

            if (oldSaved) {
              await AsyncStorage.setItem(
                HISTORY_KEY,
                oldSaved
              );

              saved =
                oldSaved;
            }
          }

          if (!saved) {
            setHistory([]);
            return;
          }

          const parsed =
            JSON.parse(saved);

          setHistory(
            Array.isArray(parsed)
              ? parsed
              : []
          );
        } catch (error) {
          console.error(
            '기록 불러오기 오류:',
            error
          );

          setHistory([]);
        }
      },
      []
    );

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const deleteItem =
    (id: string) => {
      Alert.alert(
        '기록 삭제',
        '이 대화 기록을 삭제할까요?',
        [
          {
            text: '취소',
            style: 'cancel',
          },

          {
            text: '삭제',
            style: 'destructive',

            onPress:
              async () => {
                const updated =
                  history.filter(
                    (item) =>
                      item.id !==
                      id
                  );

                setHistory(
                  updated
                );

                await AsyncStorage.setItem(
                  HISTORY_KEY,
                  JSON.stringify(
                    updated
                  )
                );
              },
          },
        ]
      );
    };

  const deleteAll =
    () => {
      if (
        history.length === 0
      ) {
        return;
      }

      Alert.alert(
        '전체 기록 삭제',
        '모든 대화 기록을 삭제할까요?',
        [
          {
            text: '취소',
            style: 'cancel',
          },

          {
            text: '전체 삭제',
            style: 'destructive',

            onPress:
              async () => {
                await AsyncStorage.removeItem(
                  HISTORY_KEY
                );

                setHistory([]);
              },
          },
        ]
      );
    };

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
            router.back()
          }
        >
          <Text
            style={styles.back}
          >
            ←
          </Text>
        </Pressable>

        <Text
          style={styles.title}
        >
          대화 기록
        </Text>

        <Pressable
          onPress={deleteAll}
          disabled={
            history.length === 0
          }
        >
          <Text
            style={[
              styles.deleteAll,
              history.length ===
                0 &&
                styles.disabled,
            ]}
          >
            전체 삭제
          </Text>
        </Pressable>
      </View>

      <View
        style={styles.summary}
      >
        <Text
          style={
            styles.summaryNumber
          }
        >
          {history.length}
        </Text>

        <Text
          style={styles.summaryText}
        >
          지금까지 연습한 대화
        </Text>
      </View>

      {history.length ===
      0 ? (
        <View
          style={styles.empty}
        >
          <Text
            style={
              styles.emptyEmoji
            }
          >
            💬
          </Text>

          <Text
            style={
              styles.emptyTitle
            }
          >
            아직 기록이 없어요
          </Text>

          <Text
            style={styles.emptyText}
          >
            대화를 한 번 연습하면
            {'\n'}
            분석 결과가 여기에 저장됩니다.
          </Text>

          <Pressable
            style={
              styles.startButton
            }
            onPress={() =>
              router.push(
                '/setup'
              )
            }
          >
            <Text
              style={
                styles.startText
              }
            >
              첫 연습 시작하기
            </Text>
          </Pressable>
        </View>
      ) : (
        history.map(
          (item) => (
            <Pressable
              key={item.id}
              style={
                styles.card
              }
              onPress={() =>
                router.push(
                  `/history-detail?historyData=${encodeURIComponent(
                    JSON.stringify(
                      item
                    )
                  )}` as any
                )
              }
            >
              <View
                style={
                  styles.cardTop
                }
              >
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={
                      styles.cardSituation
                    }
                    numberOfLines={
                      1
                    }
                  >
                    {item.situation}
                  </Text>

                  <Text
                    style={
                      styles.cardDate
                    }
                  >
                    {formatDate(
                      item.date
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.scoreBox
                  }
                >
                  <Text
                    style={
                      styles.score
                    }
                  >
                    {item.analysis
                      ?.overallScore ??
                      0}
                  </Text>

                  <Text
                    style={
                      styles.scoreUnit
                    }
                  >
                    /100
                  </Text>
                </View>
              </View>

              {item.pdfName &&
                item.situation ===
                  '발표 후 질문' && (
                  <View
                    style={
                      styles.pdfBadge
                    }
                  >
                    <Text
                      style={
                        styles.pdfBadgeText
                      }
                    >
                      📄 발표 PDF ·{' '}
                      {item.pdfName}
                    </Text>
                  </View>
                )}

              <View
                style={
                  styles.cardBottom
                }
              >
                <Text
                  style={
                    styles.personality
                  }
                >
                  {item.personality}
                </Text>

                <Pressable
                  onPress={(
                    event
                  ) => {
                    event.stopPropagation();
                    deleteItem(
                      item.id
                    );
                  }}
                >
                  <Text
                    style={
                      styles.delete
                    }
                  >
                    삭제
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          )
        )
      )}
    </ScrollView>
  );
}

function formatDate(
  value: string
) {
  try {
    const date =
      new Date(value);

    return date.toLocaleString(
      'ko-KR',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  } catch {
    return value;
  }
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#F7F7F8',
    },

    content: {
      width: '100%',
      maxWidth: 700,
      alignSelf: 'center',
      padding: 24,
      paddingBottom: 60,
    },

    header: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      marginBottom: 25,
    },

    back: {
      fontSize: 27,
    },

    title: {
      fontSize: 22,
      fontWeight: '900',
    },

    deleteAll: {
      color: '#888888',
      fontSize: 11,
      fontWeight: '700',
    },

    disabled: {
      opacity: 0.3,
    },

    summary: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 17,
      padding: 20,
      alignItems:
        'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor:
        '#EEEEEE',
    },

    summaryNumber: {
      fontSize: 30,
      fontWeight: '900',
    },

    summaryText: {
      color: '#888888',
      fontSize: 11,
      marginTop: 3,
    },

    card: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 17,
      padding: 17,
      marginBottom: 10,
      borderWidth: 1,
      borderColor:
        '#EEEEEE',
    },

    cardTop: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    cardSituation: {
      fontSize: 15,
      fontWeight: '800',
    },

    cardDate: {
      marginTop: 5,
      color: '#999999',
      fontSize: 10,
    },

    scoreBox: {
      alignItems:
        'flex-end',
    },

    score: {
      fontSize: 24,
      fontWeight: '900',
    },

    scoreUnit: {
      color: '#AAAAAA',
      fontSize: 9,
    },

    pdfBadge: {
      marginTop: 12,
      padding: 9,
      borderRadius: 9,
      backgroundColor:
        '#F7F7F8',
    },

    pdfBadgeText: {
      color: '#777777',
      fontSize: 10,
    },

    cardBottom: {
      marginTop: 13,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor:
        '#EEEEEE',
      flexDirection:
        'row',
      justifyContent:
        'space-between',
    },

    personality: {
      color: '#777777',
      fontSize: 11,
    },

    delete: {
      color: '#AAAAAA',
      fontSize: 11,
    },

    empty: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 18,
      padding: 30,
      alignItems:
        'center',
    },

    emptyEmoji: {
      fontSize: 35,
    },

    emptyTitle: {
      marginTop: 12,
      fontSize: 16,
      fontWeight: '800',
    },

    emptyText: {
      marginTop: 8,
      color: '#999999',
      fontSize: 12,
      lineHeight: 18,
      textAlign:
        'center',
    },

    startButton: {
      marginTop: 20,
      backgroundColor:
        '#111111',
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },

    startText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },
  });