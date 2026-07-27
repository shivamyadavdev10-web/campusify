import React, { useState, useRef, useCallback } from 'react';
import { Text, StyleSheet, Alert, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Phone, Mail, Lock } from 'lucide-react-native';
import { AxiosError } from 'axios';

import axiosClient from '../../api/axiosClient.api';
import CustomInput from '../../components/common/CustomInput.common';
import PrimaryButton from '../../components/common/PrimaryButton.common';
import { validateRegistrationForm } from '../../utils/validators.utils';
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';

export default function RegisterScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phoneNo: '', email: '', createPassword: '', confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Navigation refs for UX
  const lastNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleRegister = async () => {
    Keyboard.dismiss();
    const validation = validateRegistrationForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors || {});
      return Alert.alert('Validation Error', 'Please fix the errors in the form.');
    }
    setErrors({});
    setLoading(true);

    try {
      await axiosClient.post('/auth/register', {
        ...formData,
        email: formData.email.trim().toLowerCase()
      });
      Alert.alert('Success', 'Registration successful. Please verify your OTP.');
      navigation.navigate('OtpVerification', { email: formData.email.trim().toLowerCase() });
    } catch (error: any) {
      const axiosErr = error as AxiosError<any>;
      const data = axiosErr.response?.data;
      Alert.alert('Registration Failed', data?.message || error.message || 'Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Replaced factory function with standard function to avoid inline re-renders
  const handleChange = (key: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to start learning today.</Text>

          <CustomInput 
            icon={User} 
            placeholder="First Name" 
            autoCapitalize="words" 
            returnKeyType="next"
            value={formData.firstName} 
            onChangeText={handleChange('firstName')} 
            error={errors.firstName} 
            onSubmitEditing={() => lastNameRef.current?.focus()}
            blurOnSubmit={false}
          />
          <CustomInput 
            ref={lastNameRef}
            icon={User} 
            placeholder="Last Name" 
            autoCapitalize="words" 
            returnKeyType="next"
            value={formData.lastName} 
            onChangeText={handleChange('lastName')} 
            error={errors.lastName} 
            onSubmitEditing={() => phoneRef.current?.focus()}
            blurOnSubmit={false}
          />
          <CustomInput 
            ref={phoneRef}
            icon={Phone} 
            placeholder="Phone Number" 
            keyboardType="phone-pad" 
            returnKeyType="next"
            value={formData.phoneNo} 
            onChangeText={handleChange('phoneNo')} 
            error={errors.phoneNo} 
            onSubmitEditing={() => emailRef.current?.focus()}
            blurOnSubmit={false}
          />
          <CustomInput 
            ref={emailRef}
            icon={Mail} 
            placeholder="Email Address" 
            keyboardType="email-address" 
            returnKeyType="next"
            value={formData.email} 
            onChangeText={handleChange('email')} 
            error={errors.email} 
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />
          <CustomInput 
            ref={passwordRef}
            icon={Lock} 
            placeholder="Password" 
            secureTextEntry 
            returnKeyType="next"
            value={formData.createPassword} 
            onChangeText={handleChange('createPassword')} 
            error={errors.createPassword} 
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            blurOnSubmit={false}
          />
          <CustomInput 
            ref={confirmPasswordRef}
            icon={Lock} 
            placeholder="Confirm Password" 
            secureTextEntry 
            returnKeyType="done"
            value={formData.confirmPassword} 
            onChangeText={handleChange('confirmPassword')} 
            error={errors.confirmPassword} 
            onSubmitEditing={handleRegister}
          />

          <PrimaryButton title="Sign Up" onPress={handleRegister} loading={loading} style={styles.submitBtn} />
          
          <TouchableOpacity style={styles.footer} onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: typography.size.xxxl, fontFamily: typography.fontFamily.extraBold, color: colors.textMain, marginBottom: 8 },
  subtitle: { fontSize: typography.size.md, color: colors.textMuted, fontFamily: typography.fontFamily.regular, marginBottom: 32 },
  footer: { alignItems: 'center', marginTop: 32 },
  linkText: { color: colors.primary, fontFamily: typography.fontFamily.semiBold, fontSize: typography.size.sm },
  keyboardAvoid: { flex: 1 },
  submitBtn: { marginTop: 8 }
});