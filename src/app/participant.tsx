import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function ParticipantScreen() {
  const { participantId } = useLocalSearchParams();
  const [name, setName] = useState('');

  const next = () => {
    router.push({
      pathname: '/consent' as any,
      params: {
        participantId: String(participantId || ''),
        name,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>참가자 정보</Text>

      <Text style={styles.subtitle}>
        참가자 번호: {String(participantId || '')}
      </Text>

      <Text style={styles.label}>이름 또는 닉네임</Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="실험에서 사용할 이름"
      />

      <Pressable
        style={styles.button}
        onPress={next}
      >
        <Text style={styles.buttonText}>다음 →</Text>
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
    marginBottom: 10,
  },
  subtitle: {
    color: '#777',
    marginBottom: 35,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
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