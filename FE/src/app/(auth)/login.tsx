import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { Mail, Lock } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setStatusMsg('');
    setLoading(true);

    // Show a friendly message after 4s in case Render is waking up
    const wakeTimer = setTimeout(() => {
      setStatusMsg('⏳ Server is waking up, please wait…');
    }, 4000);

    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      const msg: string = err.message || 'An unexpected error occurred. Please try again.';

      // Friendly messages for known backend errors
      if (msg.includes('Network Error') || msg.includes('timeout')) {
        setError('Cannot reach server. Check your internet or try again in a moment.');
      } else {
        setError(msg);
      }
    } finally {
      clearTimeout(wakeTimer);
      setLoading(false);
      setStatusMsg('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center px-6">
        <View className="mb-10">
          <Text className="text-4xl font-bold text-text mb-2">Campusify</Text>
          <Text className="text-textMuted text-lg">Sign in to continue</Text>
        </View>

        {error ? (
          <Text className="text-red-500 mb-4 text-center">{error}</Text>
        ) : null}

        {statusMsg && !error ? (
          <Text className="text-yellow-400 mb-4 text-center text-sm">{statusMsg}</Text>
        ) : null}

        <View className="bg-secondary flex-row items-center rounded-xl px-4 py-3 mb-4">
          <Mail color="#9ca3af" size={20} />
          <TextInput
            className="flex-1 text-text ml-3 text-base h-10"
            placeholder="Email address"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        <View className="bg-secondary flex-row items-center rounded-xl px-4 py-3 mb-8">
          <Lock color="#9ca3af" size={20} />
          <TextInput
            className="flex-1 text-text ml-3 text-base h-10"
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          className={`bg-primary rounded-xl py-4 items-center flex-row justify-center active:opacity-80 ${
            loading ? 'opacity-70' : ''
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
          ) : null}
          <Text className="text-text font-bold text-lg">
            {loading ? 'Signing in…' : 'Sign In'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
