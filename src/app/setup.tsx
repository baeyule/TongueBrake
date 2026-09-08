import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  '기타 상황',
];

const conversationTypes = [
  '일반 대화',
  '질문 중심',
  '친근한 대화',
  '진지한 대화',
];

const difficulties = [
  '쉬움',
  '보통',
  '어려움',
];

export default function SetupScreen() {
  const params = useLocalSearchParams();

  const initialSituation = String(
    params.situation || ''
  );

  const [situation, setSituation] =
    useState(initialSituation);

  const [customSituation, setCustomSituation] =
    useState('');

  const [myRole, setMyRole] =
    useState('학생');

  const [opponent, setOpponent] =
    useState('친구');

  const [difficulty, setDifficulty] =
    useState('보통');

  const [conversationType, setConversationType] =
    useState('일반 대화');

  const [university, setUniversity] =
    useState('');

  const [department, setDepartment] =
    useState('');

  const [speechConcern, setSpeechConcern] =
    useState('');

  const [gender, setGender] =
    useState('');

  const [pdfFile, setPdfFile] =
    useState<{
      uri: string;
      name: string;
    } | null>(null);

  const pickPdf = async () => {
    try {
      const result =
        await DocumentPicker.getDocumentAsync({
          type: 'application/pdf',
          copyToCacheDirectory: true,
          multiple: false,
        });

      if (
        !result.canceled &&
        result.assets?.length
      ) {
        const asset = result.assets[0];

        setPdfFile({
          uri: asset.uri,
          name:
            asset.name ||
            'presentation.pdf',
        });
      }
    } catch (error) {
      console.error(
        'PDF 선택 오류:',
        error
      );
    }
  };

  const startChat = () => {
    const finalSituation =
      situation === '기타 상황'
        ? customSituation.trim()
        : situation.trim();

    if (!finalSituation) {
      return;
    }

    if (
      situation === '발표 후 질문' &&
      !pdfFile
    ) {
      return;
    }

    router.push(
      `/chat?myRole=${encodeURIComponent(
        myRole
      )}&opponent=${encodeURIComponent(
        opponent
      )}&situation=${encodeURIComponent(
        finalSituation
      )}&difficulty=${encodeURIComponent(
        difficulty
      )}&conversationType=${encodeURIComponent(
        conversationType
      )}&university=${encodeURIComponent(
        university
      )}&department=${encodeURIComponent(
        department
      )}&speechConcern=${encodeURIComponent(
        speechConcern
      )}&gender=${encodeURIComponent(
        gender
      )}&pdfUri=${encodeURIComponent(
        pdfFile?.uri || ''
      )}&pdfName=${encodeURIComponent(
        pdfFile?.name || ''
      )}` as any
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
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
          대화 설정
        </Text>

        <View style={{ width: 28 }} />
      </View>

      <Text style={styles.sectionTitle}>
        어떤 상황을 연습할까요?
      </Text>

      <View style={styles.optionGrid}>
        {situations.map((item) => (
          <Pressable
            key={item}
            style={[
              styles.option,
              situation === item &&
                styles.optionSelected,
            ]}
            onPress={() =>
              setSituation(item)
            }
          >
            <Text
              style={[
                styles.optionText,
                situation === item &&
                  styles.optionTextSelected,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      {situation === '기타 상황' && (
        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            어떤 상황인가요?
          </Text>

          <TextInput
            style={styles.input}
            placeholder="예: 동아리 선배에게 처음 말을 걸기"
            value={customSituation}
            onChangeText={
              setCustomSituation
            }
          />
        </View>
      )}

      <Text style={styles.sectionTitle}>
        대화 유형
      </Text>

      <View style={styles.rowOptions}>
        {conversationTypes.map(
          (item) => (
            <Pressable
              key={item}
              style={[
                styles.smallOption,
                conversationType ===
                  item &&
                  styles.optionSelected,
              ]}
              onPress={() =>
                setConversationType(
                  item
                )
              }
            >
              <Text
                style={[
                  styles.optionText,
                  conversationType ===
                    item &&
                    styles.optionTextSelected,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          )
        )}
      </View>

      <Text style={styles.sectionTitle}>
        난이도
      </Text>

      <View style={styles.rowOptions}>
        {difficulties.map(
          (item) => (
            <Pressable
              key={item}
              style={[
                styles.smallOption,
                difficulty === item &&
                  styles.optionSelected,
              ]}
              onPress={() =>
                setDifficulty(item)
              }
            >
              <Text
                style={[
                  styles.optionText,
                  difficulty === item &&
                    styles.optionTextSelected,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          )
        )}
      </View>

      <Text style={styles.sectionTitle}>
        역할 설정
      </Text>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          내 역할
        </Text>

        <TextInput
          style={styles.input}
          placeholder="예: 학생"
          value={myRole}
          onChangeText={setMyRole}
        />

        <Text style={styles.label}>
          상대방 역할
        </Text>

        <TextInput
          style={styles.input}
          placeholder="예: 친구"
          value={opponent}
          onChangeText={setOpponent}
        />
      </View>

      {situation === '면접' && (
        <View style={styles.specialCard}>
          <Text style={styles.specialTitle}>
            🎤 면접 정보
          </Text>

          <TextInput
            style={styles.input}
            placeholder="희망 대학교"
            value={university}
            onChangeText={setUniversity}
          />

          <TextInput
            style={styles.input}
            placeholder="희망 학과"
            value={department}
            onChangeText={setDepartment}
          />

          <TextInput
            style={styles.input}
            placeholder="말하기에서 걱정되는 부분"
            value={speechConcern}
            onChangeText={setSpeechConcern}
          />
        </View>
      )}

      {situation === '발표 후 질문' && (
        <View style={styles.specialCard}>
          <Text style={styles.specialTitle}>
            📄 발표 자료
          </Text>

          <Text style={styles.specialDescription}>
            PDF를 올리면 AI가 발표 내용을 읽고
            실제 청중처럼 질문합니다.
          </Text>

          <Pressable
            style={styles.pdfButton}
            onPress={pickPdf}
          >
            <Text style={styles.pdfButtonText}>
              {pdfFile
                ? 'PDF 다시 선택'
                : '발표 PDF 선택'}
            </Text>
          </Pressable>

          {pdfFile && (
            <View style={styles.pdfInfo}>
              <Text style={styles.pdfIcon}>
                📄
              </Text>

              <View style={{ flex: 1 }}>
                <Text
                  style={styles.pdfName}
                  numberOfLines={2}
                >
                  {pdfFile.name}
                </Text>

                <Text style={styles.pdfReady}>
                  발표 자료가 준비됐어요
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {situation === '처음 만난 사람' && (
        <View style={styles.specialCard}>
          <Text style={styles.specialTitle}>
            👤 상대방 정보
          </Text>

          <TextInput
            style={styles.input}
            placeholder="상대방 성별 (선택)"
            value={gender}
            onChangeText={setGender}
          />
        </View>
      )}

      <Pressable
        style={[
          styles.startButton,
          (!situation ||
            (situation ===
              '기타 상황' &&
              !customSituation.trim()) ||
            (situation ===
              '발표 후 질문' &&
              !pdfFile)) &&
            styles.startDisabled,
        ]}
        onPress={startChat}
        disabled={
          !situation ||
          (situation === '기타 상황' &&
            !customSituation.trim()) ||
          (situation ===
            '발표 후 질문' &&
            !pdfFile)
        }
      >
        <Text style={styles.startText}>
          대화 시작 →
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
    maxWidth: 700,
    alignSelf: 'center',
    padding: 24,
    paddingBottom: 60,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },

  back: {
    fontSize: 28,
  },

  title: {
    fontSize: 23,
    fontWeight: '900',
  },

  sectionTitle: {
    marginTop: 10,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '800',
  },

  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  option: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9E9E9',
  },

  optionSelected: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },

  optionText: {
    fontSize: 12,
    color: '#555555',
    fontWeight: '600',
  },

  optionTextSelected: {
    color: '#FFFFFF',
  },

  rowOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  smallOption: {
    flex: 1,
    minWidth: 90,
    paddingVertical: 12,
    borderRadius: 11,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9E9E9',
  },

  inputBlock: {
    marginTop: 3,
  },

  label: {
    marginTop: 12,
    marginBottom: 7,
    fontSize: 12,
    fontWeight: '700',
    color: '#555555',
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 13,
    marginBottom: 9,
  },

  specialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 17,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },

  specialTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },

  specialDescription: {
    color: '#777777',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 13,
  },

  pdfButton: {
    backgroundColor: '#111111',
    borderRadius: 11,
    paddingVertical: 13,
    alignItems: 'center',
  },

  pdfButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  pdfInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F7F7F8',
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  pdfIcon: {
    fontSize: 22,
  },

  pdfName: {
    fontSize: 12,
    fontWeight: '700',
  },

  pdfReady: {
    marginTop: 3,
    fontSize: 11,
    color: '#777777',
  },

  startButton: {
    backgroundColor: '#111111',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 30,
  },

  startDisabled: {
    opacity: 0.35,
  },

  startText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});