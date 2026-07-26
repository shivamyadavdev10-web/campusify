import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import axiosClient from '../../api/axiosClient.api';
import { useAuthStore } from '../../store/useAuthStore';
import CustomInput from '../../components/common/CustomInput.common';
import PrimaryButton from '../../components/common/PrimaryButton.common';
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';

export default function OtpScreen({ route }: { route: any; navigation: any }) {
  const { email } = route.params;
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  
  // 🟢 1. Naya function import kiya Context se
  const { verifyOtpAndLogin } = useAuthStore();

  useEffect(() => {
    let interval = null;
    if (timer > 0) interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    if (otp.length !== 6) return Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP.');

    setLoading(true);
    try {
      // 🟢 2. Direct Context function call kiya. Device ID aur Axios call internally handle honge.
      const result = await verifyOtpAndLogin(email, otp);
      
      if (result.success) {
          Alert.alert('Verified', 'Account verified successfully!');
          // App automatically Home/Main stack par chali jayegi kyunki AuthContext state update kar dega
      } else {
          Alert.alert('Verification Failed', result.message);
      }
    } catch {
      Alert.alert('Verification Failed', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setTimer(60);
    try {
      await axiosClient.post('/auth/resend-otp', { email });
      Alert.alert('Success', 'A new OTP has been sent.');
    } catch {
      Alert.alert('Error', 'Failed to resend OTP.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify Email</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>

        <CustomInput
          placeholder="000000"
          keyboardType="numeric"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          style={styles.otpInput}
        />

        <PrimaryButton title="Verify OTP" onPress={handleVerify} loading={loading} />

        <TouchableOpacity onPress={handleResend} disabled={timer > 0} style={styles.footer}>
          <Text style={[styles.linkText, timer > 0 && { color: colors.textLight }]}>
            {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: typography.size.xxxl, fontFamily: typography.fontFamily.extraBold, color: colors.textMain, marginBottom: 8 },
  subtitle: { fontSize: typography.size.md, color: colors.textMuted, fontFamily: typography.fontFamily.regular, marginBottom: 32 },
  otpInput: { textAlign: 'center' as const, letterSpacing: 8, fontSize: typography.size.xl },
  footer: { alignItems: 'center', marginTop: 32 },
  linkText: { color: colors.primary, fontFamily: typography.fontFamily.semiBold, fontSize: typography.size.sm }
} as const);