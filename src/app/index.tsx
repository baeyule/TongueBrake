
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function HomeScreen() {
  const [participantId, setParticipantId] = useState('');

  const startExperiment = () => {
    const id = participantId.trim();

    if (!id) {
      alert('참가자 번호를 입력해주세요.');
      return;
    }

    router.push({
      pathname: '/participant',
      params: {
        participantId: id,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Tongue Brake</Text>

      <Text style={styles.title}>대화 습관 실험</Text>

      <Text style={styles.description}>
        참가자 번호를 입력한 후{'\n'}
        실험을 시작해주세요.
      </Text>

      <Text style={styles.label}>참가자 번호</Text>

      <TextInput
        value={participantId}
        onChangeText={setParticipantId}
        placeholder="예: 001"
        keyboardType="number-pad"
        maxLength={10}
        style={styles.input}
      />

      <Pressable
        style={[
          styles.button,
          !participantId.trim() && styles.buttonDisabled,
        ]}
        onPress={startExperiment}
        disabled={!participantId.trim()}
      >
        <Text style={styles.buttonText}>
          실험 시작하기 →
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

  logo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginBottom: 45,
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111',
    marginBottom: 14,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#666',
    marginBottom: 30,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },

  input: {
    height: 52,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 17,
    color: '#111',
    marginBottom: 14,
  },

  button: {
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
  },

  buttonDisabled: {
    opacity: 0.35,
  },

  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
