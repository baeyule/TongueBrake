import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="setup" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="result" />
      <Stack.Screen name="history" />
      <Stack.Screen name="history-detail" />
      <Stack.Screen name="settings" />

      {/* 실험용 화면은 나중에 별도 앱으로 이동 */}
      <Stack.Screen name="participant" />
      <Stack.Screen name="consent" />
      <Stack.Screen name="pre-survey" />
    </Stack>
  );
}