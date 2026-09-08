import { router, useLocalSearchParams } from 'expo-router';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function PreSurveyScreen() {
  const { participantId, name } = useLocalSearchParams();

  const next = () => {
    router.push({
      pathname: '/real-conversation' as any,
      params: {
        participantId: String(participantId || ''),
        name: String(name || ''),
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>사전 설문</Text>

      <Text style={styles.subtitle}>
        참가자 {String(participantId || '')}
      </Text>

      <View style={styles.card}>
        <Text style={styles.question}>
          처음 만난 사람과 대화할 때 나는...
        </Text>

        <Text style={styles.option}>
          ○ 매우 편하다
        </Text>

        <Text style={styles.option}>
          ○ 편한 편이다
        </Text>

        <Text style={styles.option}>
          ○ 보통이다
        </Text>

        <Text style={styles.option}>
          ○ 어려운 편이다
        </Text>

        <Text style={styles.option}>
          ○ 매우 어렵다
        </Text>
      </View>

      <Pressable
        style={styles.button}
        onPress={next}
      >
        <Text style={styles.buttonText}>
          설문 완료 → 실제 대화
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#F7F7F8',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
  },
  subtitle: {
    color: '#777',
    marginTop: 8,
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#eee',
  },
  question: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 20,
  },
  option: {
    fontSize: 15,
    marginBottom: 15,
    color: '#444',
  },
  button: {
    marginTop: 25,
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },
});