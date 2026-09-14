import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SERVER_URL } from '../config';

type Message = {
  type: 'user' | 'assistant';
  text: string;
};

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    situation?: string;
    myRole?: string;
    opponent?: string;
    difficulty?: string;
    conversationType?: string;
    university?: string;
    department?: string;
    speechConcern?: string;
    gender?: string;
    pdfUri?: string;
    pdfName?: string;
  }>();

  const situation = String(
    params.situation || '일상적인 대화'
  );

  const myRole = String(
    params.myRole || '학생'
  );

  const opponent = String(
    params.opponent || '상대방'
  );

  const difficulty = String(
    params.difficulty || '보통'
  );

  const conversationType = String(
    params.conversationType || '일반 대화'
  );

  const university = String(
    params.university || ''
  );

  const department = String(
    params.department || ''
  );

  const speechConcern = String(
    params.speechConcern || ''
  );

  const gender = String(
    params.gender || ''
  );

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [input, setInput] = useState('');

  const [loading, setLoading] =
    useState(false);

  const [started, setStarted] =
    useState(false);

  async function callChatServer(
    message: string,
    conversation: string
  ) {
    const response = await fetch(
      `${SERVER_URL}/chat`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          message,
          myRole,
          opponent,
          situation,
          difficulty,
          conversationType,
          university,
          department,
          speechConcern,
          gender,
          conversation,
        }),
      }
    );

    const rawText = await response.text();

    let data: any = {};

    try {
      data = JSON.parse(rawText);
    } catch {
      data = {
        error: rawText,
      };
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
          data?.message ||
          `서버 오류 (${response.status})`
      );
    }

    if (!data?.reply) {
      throw new Error(
        'AI 응답이 없습니다.'
      );
    }

    return String(data.reply);
  }

  async function startConversation() {
    if (started || loading) return;

    setLoading(true);

    try {
      /*
       * 첫 요청에서는 빈 문자열을 보내지 않는다.
       * 서버가 이것을 "대화 시작"으로 명확하게 판단할 수 있도록
       * 특별한 시작 메시지를 보낸다.
       */

      const reply =
        await callChatServer(
          '__START_CONVERSATION__',
          ''
        );

      setMessages([
        {
          type: 'assistant',
          text: reply,
        },
      ]);

      setStarted(true);
    } catch (error) {
      console.error(
        '대화 시작 오류:',
        error
      );

      alert(
        `대화를 시작하지 못했습니다.\n\n${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    const text = input.trim();

    if (!text || loading) return;

    const userMessage: Message = {
      type: 'user',
      text,
    };

    const nextMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const conversation =
        nextMessages
          .map((item) => {
            const speaker =
              item.type === 'user'
                ? '사용자'
                : '상대방';

            return `${speaker}: ${item.text}`;
          })
          .join('\n');

      const reply =
        await callChatServer(
          text,
          conversation
        );

      setMessages([
        ...nextMessages,
        {
          type: 'assistant',
          text: reply,
        },
      ]);
    } catch (error) {
      console.error(
        '메시지 전송 오류:',
        error
      );

      setMessages([
        ...nextMessages,
        {
          type: 'assistant',
          text:
            '응답을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function endConversation() {
    if (messages.length < 2) {
      alert(
        '대화를 조금 더 진행해주세요.'
      );
      return;
    }

    try {
      const transcript =
        messages
          .map((item) => {
            const speaker =
              item.type === 'user'
                ? '사용자'
                : '상대방';

            return `${speaker}:${item.text}`;
          })
          .join('\n');

      const conversationData = {
        messages: transcript,
        situation,
        personality: conversationType,
        savedAt:
          new Date().toISOString(),
      };

      await AsyncStorage.removeItem(
        'tongue_brake_current_conversation'
      );

      await AsyncStorage.setItem(
        'tongue_brake_current_conversation',
        JSON.stringify(
          conversationData
        )
      );

      console.log(
        '✅ 분석용 대화 저장 완료'
      );

      router.push('/result');
    } catch (error) {
      console.error(
        '대화 저장 오류:',
        error
      );

      alert(
        '대화를 저장하지 못했습니다.'
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            대화 연습
          </Text>

          <Text style={styles.subtitle}>
            {situation} · {difficulty}
          </Text>
        </View>

        <Pressable
          style={styles.endButton}
          onPress={endConversation}
        >
          <Text style={styles.endButtonText}>
            종료
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.messages}
        contentContainerStyle={
          styles.messagesContent
        }
      >
        {!started && (
          <View style={styles.startBox}>
            <Text style={styles.startTitle}>
              {opponent}와 대화를
              시작해보세요.
            </Text>

            <Text style={styles.startText}>
              실제 상황처럼 대화하고,
              끝난 뒤 AI가 대화를
              분석합니다.
            </Text>

            <Pressable
              style={styles.startButton}
              onPress={startConversation}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={
                    styles.startButtonText
                  }
                >
                  대화 시작
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {messages.map(
          (message, index) => (
            <View
              key={`${index}-${message.type}`}
              style={[
                styles.messageRow,
                message.type === 'user'
                  ? styles.userRow
                  : styles.assistantRow,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  message.type === 'user'
                    ? styles.userBubble
                    : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.type === 'user'
                      ? styles.userText
                      : styles.assistantText,
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            </View>
          )
        )}

        {loading && started && (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
          </View>
        )}
      </ScrollView>

      {started && (
        <View style={styles.inputArea}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="메시지를 입력하세요"
            placeholderTextColor="#999"
            style={styles.input}
            multiline
            editable={!loading}
          />

          <Pressable
            style={[
              styles.sendButton,
              (!input.trim() ||
                loading) &&
                styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={
              !input.trim() || loading
            }
          >
            <Text style={styles.sendButtonText}>
              전송
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#777777',
  },

  endButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EEEEEE',
  },

  endButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },

  messages: {
    flex: 1,
  },

  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },

  startBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },

  startTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
  },

  startText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#666666',
  },

  startButton: {
    marginTop: 18,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  startButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  messageRow: {
    width: '100%',
    marginBottom: 10,
    flexDirection: 'row',
  },

  userRow: {
    justifyContent: 'flex-end',
  },

  assistantRow: {
    justifyContent: 'flex-start',
  },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
  },

  userBubble: {
    backgroundColor: '#111111',
  },

  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },

  userText: {
    color: '#FFFFFF',
  },

  assistantText: {
    color: '#222222',
  },

  loadingRow: {
    paddingVertical: 8,
    alignItems: 'flex-start',
  },

  inputArea: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },

  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
  },

  sendButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonDisabled: {
    backgroundColor: '#BBBBBB',
  },

  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});