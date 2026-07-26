import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  ScrollView, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, KeyRound } from 'lucide-react-native';

import axiosClient from '../../api/axiosClient.api';
import CustomInput from '../../components/common/CustomInput.common';
import PrimaryButton from '../../components/common/PrimaryButton.common';
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';

export default function ResetPasswordScreen({ route, navigation }: { route: any; navigation: any }) {
  const email = route?.params?.email || 'your registered email';

  const [formData, setFormData] = useState({ 
    newPassword: '', 
    confirmPassword: '',
    otp: '' 
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = async () => {
    const { newPassword, confirmPassword, otp } = formData;

    if (newPassword.length < 6) {
      return Alert.alert('Validation Error', 'Password must be at least 6 characters long.');
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert('Validation Error', 'New passwords do not match.');
    }
    if (otp.length !== 6) {
      return Alert.alert('Validation Error', 'Please enter a valid 6-digit OTP.');
    }

    setLoading(true);
    try {
      const response = await axiosClient.post('/auth/reset-password', { 
        email, 
        otp, 
        newPassword,
        confirmNewPassword: confirmPassword 
      });
      
      if (response.data.status) {
        Alert.alert('Success 🎉', 'Password has been reset successfully. Please login with your new password.', [
          {
            text: 'Login Now',
            onPress: () => {
              // ✅ Fix: Auth Stack ke andar jo bhi aapka Login screen ka name hai wahan bhej do
              // Agar direct peeche jana hai toh navigation.goBack() ya popToTop() bhi use kar sakte ho
              navigation.navigate('Login'); 
            }
          }
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        'Reset Failed', 
        error.response?.data?.message || 'Failed to reset password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your new password and the OTP sent to {email}.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <CustomInput 
              icon={Lock} 
              placeholder="New Password" 
              secureTextEntry 
              value={formData.newPassword} 
              onChangeText={(text) => handleChange('newPassword', text)} 
            />
            
            <CustomInput 
              icon={Lock} 
              placeholder="Confirm New Password" 
              secureTextEntry 
              value={formData.confirmPassword} 
              onChangeText={(text) => handleChange('confirmPassword', text)} 
            />

            <CustomInput 
              icon={KeyRound} 
              placeholder="Enter 6-Digit OTP" 
              keyboardType="numeric" 
              maxLength={6} 
              value={formData.otp} 
              onChangeText={(text) => handleChange('otp', text)} 
            />

            <PrimaryButton 
              title="Update Password" 
              onPress={handleReset} 
              loading={loading} 
              style={styles.submitBtn} 
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: typography.size.xxxl, fontFamily: typography.fontFamily.extraBold, color: colors.textMain, marginBottom: 8 },
  subtitle: { fontSize: typography.size.md, color: colors.textMuted, fontFamily: typography.fontFamily.regular, lineHeight: 22 },
  formContainer: { gap: 16 },
  submitBtn: { marginTop: 8 }
});