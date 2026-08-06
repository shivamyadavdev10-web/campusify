import React from 'react';
import { Pressable, Text, ActivityIndicator, ViewStyle, StyleProp, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button = React.memo(({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}: ButtonProps) => {
  const baseClasses = 'flex-row items-center justify-center rounded-xl active:opacity-80';
  
  const variantClasses = {
    primary: 'bg-primary',
    secondary: 'bg-surface-container-low',
    danger: 'bg-error',
    ghost: 'bg-transparent',
  };

  const sizeClasses = {
    sm: 'py-2 px-3',
    md: 'py-3 px-4',
    lg: 'py-4 px-6',
  };

  const textVariantClasses = {
    primary: 'text-on-primary',
    secondary: 'text-on-surface',
    danger: 'text-on-error',
    ghost: 'text-primary',
  };

  const textSizeClasses = {
    sm: 'text-sm font-medium',
    md: 'text-base font-semibold',
    lg: 'text-lg font-bold',
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        (disabled || isLoading) ? 'opacity-50' : ''
      }`}
      style={style as any}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'ghost' ? '#004ac6' : '#ffffff'} size="small" />
      ) : (
        <>
          {icon}
          <Text
            className={`${textVariantClasses[variant]} ${textSizeClasses[size]} ${
              icon ? 'ml-2' : ''
            }`}
            style={textStyle as any}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
});

Button.displayName = 'Button';
