import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface BranchCardProps {
  branch: any;
  onPress: () => void;
}

export default React.memo(function BranchCard({ branch, onPress }: BranchCardProps) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-secondary rounded-xl p-4 min-h-[120px] justify-center items-center"
      activeOpacity={0.7}
    >
      <View className="w-12 h-12 bg-[#121212] rounded-full items-center justify-center mb-3">
        {/* Placeholder for branch icon */}
        <Text className="text-primary font-bold text-lg">{branch.shortName?.[0] || 'B'}</Text>
      </View>
      <Text className="text-text font-bold text-center mb-1" numberOfLines={2}>
        {branch.name}
      </Text>
      {branch.shortName && (
        <Text className="text-textMuted text-xs">{branch.shortName}</Text>
      )}
    </TouchableOpacity>
  );
});
