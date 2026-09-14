import { router } from 'expo-router';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const situations = [
  '처음 만난 사람',
  '친구와 대화',
  '친구와 갈등',
  '조별과제',
  '선생님과 상담',
  '면접',
  '발표 후 질문',
  '전화로 문의하기',
  '어색한 침묵 이어가기',
];

export default function HomeScreen() {
  const goToSetup = (situation?: string) => {
    if (situation) {
      router.push({
        pathname: '/setup',
        params: {
          situation,
        },
      });
    } else {
      router.push('/setup');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Tongue Brake</Text>

        <Text style={styles.subtitle}>
          AI와 대화하며{'\n'}
          나의 대화 방식을 연습해보세요.
        </Text>

        <Pressable
          style={styles.mainButton}
          onPress={() => goToSetup()}
        >
          <Text style={styles.mainButtonText}>
            대화 연습 시작하기
          </Text>
        </Pressable>

        <Text style={styles.sectionTitle}>
          바로 연습하기
        </Text>

        <View style={styles.list}>
          {situations.map((situation) => (
            <Pressable
              key={situation}
              style={styles.situationButton}
              onPress={() => goToSetup(situation)}
            >
              <Text style={styles.situationText}>
                {situation}
              </Text>

              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.historyButton}
          onPress={() => router.push('/history')}
        >
          <Text style={styles.historyText}>
            지난 대화 기록 보기
          </Text>
        </Pressable>

        <Pressable
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.settingsText}>
            설정
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  content: {
    padding: 24,
    paddingBottom: 50,
  },

  title: {
    fontSize: 34,
    fontWeight: '800',
    marginTop: 30,
    marginBottom: 12,
    color: '#111111',
  },

  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    color: '#666666',
    marginBottom: 28,
  },

  mainButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 34,
  },

  mainButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 14,
  },

  list: {
    gap: 10,
  },

  situationButton: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
  },

  situationText: {
    fontSize: 16,
    color: '#222222',
  },

  arrow: {
    fontSize: 25,
    color: '#999999',
  },

  historyButton: {
    marginTop: 30,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  historyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },

  settingsButton: {
    alignItems: 'center',
    marginTop: 18,
  },

  settingsText: {
    fontSize: 14,
    color: '#888888',
  },
});