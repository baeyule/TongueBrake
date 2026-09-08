import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Message = {
  id: string;
  type: 'opponent' | 'user';
  text: string;
};

const SERVER_URL = 'http://10.243.27.137:3000';

export default function ChatScreen() {
  const params = useLocalSearchParams();

  const myRole = String(
    params.myRole || '학생'
  );

  const opponent = String(
    params.opponent || '친구'
  );

  const situation = String(
    params.situation || '일상적인 대화'
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

  const pdfUri = String(
    params.pdfUri || ''
  );

  const pdfName = String(
    params.pdfName || ''
  );

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [input, setInput] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [hint, setHint] =
    useState('');

  const [documentText, setDocumentText] =
    useState('');

  const [pdfLoading, setPdfLoading] =
    useState(
      situation === '발표 후 질문' &&
        !!pdfUri
    );

  const scrollRef =
    useRef<ScrollView>(null);

  const uploadPdf = async () => {
    if (!pdfUri) {
      return '';
    }

    try {
      const fileResponse =
        await fetch(pdfUri);

      const blob =
        await fileResponse.blob();

      const formData =
        new FormData();

      formData.append(
        'file',
        new File(
          [blob],
          pdfName || 'presentation.pdf',
          {
            type: 'application/pdf',
          }
        )
      );

      const response =
        await fetch(
          `${SERVER_URL}/upload-pdf`,
          {
            method: 'POST',
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'PDF를 읽지 못했습니다.'
        );
      }

      const text =
        String(data?.text || '');

      if (!text.trim()) {
        throw new Error(
          'PDF에서 읽을 수 있는 내용이 없습니다.'
        );
      }

      return text;
    } catch (error) {
      console.error(
        'PDF 업로드 오류:',
        error
      );

      throw error;
    }
  };

  const requestChat = async (
    currentConversation: Message[],
    pdfText: string
  ) => {
    const transcript =
      currentConversation
        .map((item) => {
          const speaker =
            item.type === 'user'
              ? '사용자'
              : '상대방';

          return `${speaker}: ${item.text}`;
        })
        .join('\n');

    const response =
      await fetch(
        `${SERVER_URL}/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            message:
              currentConversation[
                currentConversation.length - 1
              ]?.text || '',

            myRole,
            opponent,
            situation,
            difficulty,
            conversationType,
            university,
            department,
            speechConcern,
            gender,

            documentText: pdfText,

            conversation: transcript,
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
          `서버 오류 (${response.status})`
      );
    }

    if (!data?.reply) {
      throw new Error(
        'AI 응답이 없습니다.'
      );
    }

    return String(data.reply);
  };

  const startConversation = async () => {
    if (loading || messages.length > 0) {
      return;
    }

    setLoading(true);

    try {
      let pdfText = '';

      if (
        situation === '발표 후 질문' &&
        pdfUri
      ) {
        pdfText =
          await uploadPdf();

        setDocumentText(pdfText);
      }

      const initialPrompt =
        situation === '발표 후 질문'
          ? `
너는 발표를 들은 실제 청중이다.

사용자가 업로드한 발표 자료를 먼저 충분히 읽고,
그 발표의 실제 내용에서 질문할 만한 부분을 찾아라.

첫 질문은 발표 자료의 구체적인 내용 하나를
직접 언급하면서 자연스럽게 질문해라.

단순한 감상 질문이나
"발표 잘 들었습니다" 같은 뻔한 질문은 피한다.

질문은 한 번에 하나만 한다.
`
          : `
실제 ${opponent}의 입장에서
대화를 자연스럽게 시작해라.

상황에 맞는 첫 대사를
1~2문장으로 말해라.

`
      ;

      const response =
        await fetch(
          `${SERVER_URL}/chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              message:
                initialPrompt,

              myRole,
              opponent,
              situation,
              difficulty,
              conversationType,
              university,
              department,
              speechConcern,
              gender,

              documentText: pdfText,

              conversation: '',
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `서버 오류 (${response.status})`
        );
      }

      const reply =
        String(
          data?.reply || ''
        ).trim();

      if (!reply) {
        throw new Error(
          'AI가 빈 응답을 반환했습니다.'
        );
      }

      setMessages([
        {
          id: '1',
          type: 'opponent',
          text: reply,
        },
      ]);
    } catch (error) {
      console.error(
        '대화 시작 오류:',
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : '대화를 시작하지 못했습니다.'
      );
    } finally {
      setLoading(false);
      setPdfLoading(false);
    }
  };

  const sendMessage = async () => {
    const text =
      input.trim();

    if (
      !text ||
      loading
    ) {
      return;
    }

    const userMessage: Message = {
      id:
        `${Date.now()}-user`,
      type: 'user',
      text,
    };

    const nextMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(nextMessages);
    setInput('');
    setHint('');
    setLoading(true);

    try {
      const reply =
        await requestChat(
          nextMessages,
          documentText
        );

      setMessages([
        ...nextMessages,
        {
          id:
            `${Date.now()}-ai`,
          type: 'opponent',
          text: reply,
        },
      ]);
    } catch (error) {
      console.error(
        'AI 응답 오류:',
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : 'AI 응답을 가져오지 못했습니다.'
      );
    } finally {
      setLoading(false);

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);
    }
  };

  const showHint = () => {
    const lastOpponent =
      [...messages]
        .reverse()
        .find(
          (item) =>
            item.type ===
            'opponent'
        );

    if (!lastOpponent) {
      return;
    }

    if (
      situation === '면접'
    ) {
      setHint(
        '핵심 경험 → 이유 → 구체적인 사례 순서로 답해보세요.'
      );
      return;
    }

    if (
      situation === '발표 후 질문'
    ) {
      setHint(
        '질문의 핵심을 먼저 답한 뒤, 발표 자료의 근거를 하나 연결해보세요.'
      );
      return;
    }

    const words =
      lastOpponent.text
        .replace(
          /[^\p{L}\p{N}\s]/gu,
          ''
        )
        .split(/\s+/)
        .filter(
          (word) =>
            word.length >= 2
        );

    const keyword =
      words[
        Math.floor(
          words.length / 2
        )
      ] || '상대방의 말';

    setHint(
      `"${keyword}"와 관련된 내용을 하나 골라서 반응해보세요.`
    );
  };

  const endConversation = () => {
    if (
      messages.length < 2
    ) {
      router.replace('/');
      return;
    }

    const transcript =
      messages
        .map((item) => {
          const speaker =
            item.type === 'user'
              ? '사용자'
              : '상대방';

          return `${speaker}: ${item.text}`;
        })
        .join('\n');

    router.push(
      `/result?messages=${encodeURIComponent(
        transcript
      )}&situation=${encodeURIComponent(
        situation
      )}&personality=${encodeURIComponent(
        conversationType
      )}` as any
    );
  };

  if (
    messages.length === 0 &&
    !loading
  ) {
    startConversation();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text
            style={styles.situation}
            numberOfLines={1}
          >
            {situation}
          </Text>

          <Text style={styles.headerInfo}>
            {opponent} · {conversationType}
            {pdfUri
              ? ' · PDF 분석'
              : ''}
          </Text>
        </View>

        <Pressable
          style={styles.endButton}
          onPress={endConversation}
        >
          <Text style={styles.endText}>
            종료
          </Text>
        </Pressable>
      </View>

      {pdfLoading && (
        <View style={styles.pdfLoading}>
          <ActivityIndicator size="small" />

          <Text style={styles.pdfLoadingText}>
            발표 자료를 읽고 질문을 준비하는 중...
          </Text>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={
          styles.messageContent
        }
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({
            animated: true,
          })
        }
      >
        {messages.map(
          (item) => (
            <View
              key={item.id}
              style={[
                styles.messageRow,
                item.type === 'user' &&
                  styles.userRow,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  item.type ===
                    'user' &&
                    styles.userBubble,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    item.type ===
                      'user' &&
                      styles.userBubbleText,
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            </View>
          )
        )}

        {loading && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator
              size="small"
            />

            <Text style={styles.loadingText}>
              상대방이 답하는 중...
            </Text>
          </View>
        )}
      </ScrollView>

      {hint && (
        <View style={styles.hint}>
          <Text style={styles.hintTitle}>
            💡 힌트
          </Text>

          <Text style={styles.hintText}>
            {hint}
          </Text>
        </View>
      )}

      <View style={styles.bottom}>
        <Pressable
          style={styles.hintButton}
          onPress={showHint}
          disabled={loading}
        >
          <Text style={styles.hintButtonText}>
            힌트
          </Text>
        </Pressable>

        <TextInput
          style={styles.input}
          placeholder="메시지를 입력하세요"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          editable={!loading}
        />

        <Pressable
          style={[
            styles.sendButton,
            (!input.trim() ||
              loading) &&
              styles.sendDisabled,
          ]}
          onPress={sendMessage}
          disabled={
            !input.trim() ||
            loading
          }
        >
          <Text style={styles.sendText}>
            ↑
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },

  header: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
  },

  situation: {
    fontSize: 16,
    fontWeight: '800',
  },

  headerInfo: {
    marginTop: 4,
    color: '#999999',
    fontSize: 11,
  },

  endButton: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: '#F1F1F1',
  },

  endText: {
    fontSize: 11,
    fontWeight: '700',
  },

  pdfLoading: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  pdfLoadingText: {
    fontSize: 11,
    color: '#777777',
  },

  messages: {
    flex: 1,
  },

  messageContent: {
    padding: 18,
    paddingBottom: 25,
  },

  messageRow: {
    marginBottom: 13,
    alignItems: 'flex-start',
  },

  userRow: {
    alignItems: 'flex-end',
  },

  bubble: {
    maxWidth: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },

  userBubble: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },

  bubbleText: {
    fontSize: 14,
    color: '#222222',
    lineHeight: 21,
  },

  userBubbleText: {
    color: '#FFFFFF',
  },

  loadingBubble: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  loadingText: {
    color: '#999999',
    fontSize: 12,
  },

  hint: {
    marginHorizontal: 15,
    marginBottom: 8,
    padding: 12,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  hintTitle: {
    fontSize: 12,
    fontWeight: '800',
  },

  hintText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
  },

  bottom: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  hintButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  hintButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },

  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 13,
    paddingHorizontal: 13,
    fontSize: 13,
  },

  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendDisabled: {
    opacity: 0.3,
  },

  sendText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },
});