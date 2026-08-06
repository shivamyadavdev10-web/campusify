import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';
import { Inbox } from 'lucide-react-native';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  message?: string; // Shorthand: sets both title and description
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = React.memo(({
  icon,
  title,
  description,
  message,
  actionLabel,
  onAction
}: EmptyStateProps) => {
  // Support the shorthand `message` prop
  const displayTitle = title || message || 'Nothing here';
  const displayDescription = description || (!title && !message ? 'No data available' : '');

  return (
    <View className="flex-1 items-center justify-center p-6 min-h-[200px]">
      <View className="mb-4 opacity-60">
        {icon || <Inbox color="#9ca3af" size={48} />}
      </View>
      <Text className="text-[#f3f4f6] text-xl font-bold mb-2 text-center">
        {displayTitle}
      </Text>
      {displayDescription ? (
        <Text className="text-[#9ca3af] text-base text-center mb-6">
          {displayDescription}
        </Text>
      ) : null}

      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={{ minWidth: 150 }}
        />
      )}
    </View>
  );
});

EmptyState.displayName = 'EmptyState';
