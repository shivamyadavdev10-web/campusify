import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { Mail, Lock } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
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
          />
        </View>

        <Pressable 
          onPress={handleLogin}
          disabled={loading}
          className={`bg-primary rounded-xl py-4 items-center flex-row justify-center active:opacity-80 ${loading ? 'opacity-70' : ''}`}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" className="mr-2" />
          ) : null}
          <Text className="text-text font-bold text-lg">Sign In</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
