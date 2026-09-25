import { Stack } from 'expo-router';

// Sign in, sign up and forgot password — one modal stack.
export default function AuthLayout() {
  return <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }} />;
}
