import React, { forwardRef, useState, memo } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native'; // 👈 Imported Eye Icons
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';

interface CustomInputProps extends TextInputProps {
  icon?: React.ElementType;
  error?: string;
  style?: StyleProp<ViewStyle>;
}

const CustomInput = forwardRef<TextInput, CustomInputProps>(({ icon: Icon, error, style, secureTextEntry, ...props }, ref) => {
  // 👁️ Local state to manage password visibility, only if it's a password field
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        {Icon && <Icon color={colors.textLight} size={20} style={styles.icon} />}
        
        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor={colors.textLight}
          autoCapitalize="none"
          secureTextEntry={isSecure} // 👈 Managed by state now
          {...props}
        />

        {/* 👁️ Render the Eye toggle ONLY if secureTextEntry was passed as a prop */}
        {secureTextEntry !== undefined && (
          <TouchableOpacity 
            onPress={() => setIsSecure(!isSecure)} 
            style={styles.eyeIcon}
            activeOpacity={0.7}
          >
            {isSecure ? (
              <EyeOff color={colors.textLight} size={20} />
            ) : (
              <Eye color={colors.primary} size={20} /> // Highlights primary color when visible
            )}
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

CustomInput.displayName = 'CustomInput';

export default memo(CustomInput);

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
  },
  inputError: { borderColor: colors.danger },
  icon: { marginRight: 12 },
  input: { 
    flex: 1, 
    fontSize: typography.size.md, 
    color: colors.textMain, 
    fontFamily: typography.fontFamily.regular 
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: { 
    color: colors.danger, 
    fontSize: typography.size.xs, 
    marginTop: 4, 
    marginLeft: 4, 
    fontFamily: typography.fontFamily.medium 
  }
});
