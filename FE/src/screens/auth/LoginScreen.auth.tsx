import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DeviceInfo from 'react-native-device-info';
import { Mail, Lock } from 'lucide-react-native';
import { AxiosError } from 'axios';

import axiosClient from '../../api/axiosClient.api'; 
import { useAuthStore } from '../../store/useAuthStore';
import CustomInput from '../../components/common/CustomInput.common';
import PrimaryButton from '../../components/common/PrimaryButton.common';
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  // Navigation refs for UX
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email || !password) return Alert.alert('Validation Error', 'Please fill in all fields.');

    setLoading(true);
    try {
      const deviceId = await DeviceInfo.getUniqueId();
      const response = await axiosClient.post('/auth/login', { 
        email: email.trim().toLowerCase(), 
        password, 
        deviceId 
      });

      if (response.data.status) {
        try {
          await login(response.data.accessToken, response.data.refreshToken); 
        } catch (postError: any) {
          Alert.alert('Post-API Error', postError.message || 'Failed during post-login steps.');
        }
      }
    } catch (error: any) {
      let errorMessage = error?.message || 'Something went wrong';

      const status = error?.response?.status;
      const data = error?.response?.data;

      if (status === 403 && data?.isVerified === false) {
          const msg = typeof data?.message === 'string' ? data.message : 'Please verify your OTP.';
          Alert.alert('Not Verified', msg);
          navigation.navigate('OtpVerification', { email: email.trim().toLowerCase() });
          return;
      }

      if (data) {
          if (typeof data === 'string') {
              errorMessage = `Server Error (${status}): Received HTML instead of JSON. Details: ${errorMessage}`;
          } else if (data.message) {
              errorMessage = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
          }
      }

      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Log in to continue your learning journey.</Text>

        <CustomInput
          icon={Mail}
          placeholder="Email Address"
          keyboardType="email-address"
          returnKeyType="next"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={() => passwordRef.current?.focus()}
          blurOnSubmit={false}
        />
        
        <CustomInput
          ref={passwordRef}
          icon={Lock}
          placeholder="Password"
          secureTextEntry
          returnKeyType="done"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotPassword}>
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>

        <PrimaryButton title="Login" onPress={handleLogin} loading={loading} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Register here</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: typography.size.xxxl, fontFamily: typography.fontFamily.extraBold, color: colors.textMain, marginBottom: 8 },
  subtitle: { fontSize: typography.size.md, color: colors.textMuted, fontFamily: typography.fontFamily.regular, marginBottom: 32 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
  linkText: { color: colors.primary, fontFamily: typography.fontFamily.semiBold, fontSize: typography.size.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: colors.textMuted, fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm }
});