import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.memo(({
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  ...props
}: InputProps) => {
  return (
    <View className="w-full mb-4">
      {label && <Text className="text-on-surface text-sm font-medium mb-1.5">{label}</Text>}
      
      <View className={`flex-row items-center bg-surface-container-lowest rounded-xl px-4 py-3 border ${error ? 'border-error' : 'border-outline-variant'}`}>
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        
        <TextInput
          className="flex-1 text-on-surface text-base p-0 font-body-lg"
          placeholderTextColor="#737686"
          {...props}
        />
        
        {rightIcon && <View className="ml-3">{rightIcon}</View>}
      </View>
      
      {error && <Text className="text-red-500 text-xs mt-1.5 ml-1">{error}</Text>}
    </View>
  );
});

Input.displayName = 'Input';
