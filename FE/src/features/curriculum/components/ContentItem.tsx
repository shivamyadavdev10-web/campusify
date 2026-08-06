import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PlayCircle, FileText, Lock } from 'lucide-react-native';

interface ContentItemProps {
  content: any;
  isSemesterPurchased: boolean;
  onPress: () => void;
}

export default React.memo(function ContentItem({ content, isSemesterPurchased, onPress }: ContentItemProps) {
  const isLocked = content.isLocked && !content.isFree && !isSemesterPurchased;
  const Icon = content.type === 'video' ? PlayCircle : FileText;

  return (
    <TouchableOpacity 
      onPress={onPress}
      className={`flex-row items-center p-3 rounded-lg mb-1 ${isLocked ? 'opacity-50' : ''}`}
      activeOpacity={0.7}
    >
      <View className="w-8 h-8 rounded bg-[#121212] items-center justify-center mr-3">
        <Icon color={isLocked ? "#9ca3af" : "#6366f1"} size={18} />
      </View>
      <View className="flex-1">
        <Text className="text-text font-medium" numberOfLines={1}>{content.title}</Text>
        <View className="flex-row items-center mt-1">
          {content.duration && <Text className="text-textMuted text-xs mr-2">{content.duration}</Text>}
          {content.isFree && !isSemesterPurchased && (
            <View className="bg-green-500/20 px-2 py-0.5 rounded">
              <Text className="text-green-500 text-[10px] font-bold">FREE</Text>
            </View>
          )}
        </View>
      </View>
      {isLocked && <Lock color="#9ca3af" size={16} />}
    </TouchableOpacity>
  );
});
