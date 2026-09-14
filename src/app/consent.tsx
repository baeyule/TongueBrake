import { router, useLocalSearchParams } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ConsentScreen() {
  const { participantId } =
    useLocalSearchParams();

  const start = () => {
    router.push({
      pathname: '/pre-survey' as any,
      params: {
        participantId: String(
          participantId || ''
        ),
      },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.logo}>
        Tongue Brake
      </Text>

      <Text style={styles.title}>
        실험 안내
      </Text>

      <Text style={styles.subtitle}>
        참가자 {String(participantId || '')}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          실험은 총 8일 동안 진행됩니다.
        </Text>

        <Text style={styles.item}>
          ① 1일차 — 사전 설문 및 실제 대화
        </Text>

        <Text style={styles.item}>
          ② 2~7일차 — AI 대화 연습
        </Text>

        <Text style={styles.item}>
          ③ 8일차 — 사후 설문 및 실제 대화
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          중요한 점
        </Text>

        <Text style={styles.description}>
          모든 참가자는 동일한 방식으로
          실험에 참여합니다.
          {'\n\n'}
          AI 대화 연습 결과와 실제 대화 평가
          결과는 각각 기록됩니다.
          {'\n\n'}
          실험 결과는 참가자 번호를 기준으로
          저장됩니다.
        </Text>
      </View>

      <Pressable
        style={styles.button}
        onPress={start}
      >
        <Text style={styles.buttonText}>
          실험 시작하기 →
        </Text>
      </Pressable>
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
    maxWidth: 650,
    alignSelf: 'center',
    padding: 30,
    paddingBottom: 60,
  },

  logo: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 15,
    marginBottom: 45,
  },

  title: {
    fontSize: 31,
    fontWeight: '900',
  },

  subtitle: {
    color: '#888888',
    marginTop: 8,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 15,
  },

  item: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 23,
    marginBottom: 7,
  },

  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
  },

  button: {
    backgroundColor: '#111111',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 25,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});