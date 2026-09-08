import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function SettingsScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
        >
          <Text style={styles.back}>
            ←
          </Text>
        </Pressable>

        <Text style={styles.title}>
          설정
        </Text>

        <View style={styles.space} />
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View>
            <Text style={styles.rowTitle}>
              앱 이름
            </Text>

            <Text style={styles.rowDescription}>
              Tongue Brake
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Pressable
          style={styles.row}
          onPress={() =>
            router.push('/history')
          }
        >
          <View>
            <Text style={styles.rowTitle}>
              📊 대화 기록
            </Text>

            <Text style={styles.rowDescription}>
              지금까지의 연습 기록 확인
            </Text>
          </View>

          <Text style={styles.arrow}>
            →
          </Text>
        </Pressable>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          Tongue Brake
        </Text>

        <Text style={styles.infoText}>
          대화를 연습하고, 실제 대화에서
          더 자연스럽게 말할 수 있도록 도와주는
          대화 연습 앱입니다.
        </Text>
      </View>

      <Text style={styles.version}>
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
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },

  back: {
    fontSize: 28,
  },

  title: {
    fontSize: 25,
    fontWeight: '800',
  },

  space: {
    width: 30,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 18,
  },

  row: {
    minHeight: 75,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },

  rowDescription: {
    fontSize: 12,
    color: '#999999',
    marginTop: 5,
  },

  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
  },

  arrow: {
    fontSize: 20,
    color: '#999999',
  },

  infoCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 18,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
  },

  infoText: {
    marginTop: 8,
    color: '#777777',
    fontSize: 12,
    lineHeight: 19,
  },

  version: {
    textAlign: 'center',
    color: '#BBBBBB',
    fontSize: 11,
    marginTop: 30,
  },
});