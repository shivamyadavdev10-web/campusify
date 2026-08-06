import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Button } from './Button';

interface ErrorStateProps {
  message: string;
  details?: string;
  onRetry?: () => void;
}

export const ErrorState = React.memo(({ message, details, onRetry }: ErrorStateProps) => {
  return (
    <View className="flex-1 items-center justify-center p-6 bg-background">
      <AlertCircle color="#ef4444" size={48} className="mb-4" />
      <Text className="text-on-surface text-lg font-semibold text-center mb-2">
        {message}
      </Text>
      {details && (
        <Text className="text-on-surface-variant text-sm text-center mb-4 px-4">
          {details}
        </Text>
      )}
      {onRetry && (
        <Button 
          title="Try Again" 
          onPress={onRetry} 
          variant="secondary"
        />
      )}
    </View>
  );
});

ErrorState.displayName = 'ErrorState';
