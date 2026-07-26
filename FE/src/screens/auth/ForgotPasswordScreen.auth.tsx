import { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail } from 'lucide-react-native';

import axiosClient from '../../api/axiosClient.api';
import CustomInput from '../../components/common/CustomInput.common';
import PrimaryButton from '../../components/common/PrimaryButton.common';
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';

export default function ForgotPasswordScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email address.');

    setLoading(true);
    try {
      await axiosClient.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      navigation.navigate('ResetPassword', { email: email.trim().toLowerCase() });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>Enter your email to receive a password reset OTP.</Text>

        <CustomInput
          icon={Mail}
          placeholder="Enter your email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <PrimaryButton title="Send OTP" onPress={handleSendOtp} loading={loading} />
        
        <TouchableOpacity style={styles.footer} onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Back to Login</Text>
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
  footer: { alignItems: 'center', marginTop: 32 },
  linkText: { color: colors.primary, fontFamily: typography.fontFamily.semiBold, fontSize: typography.size.sm }
});