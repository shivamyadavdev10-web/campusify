import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { PlayCircle } from 'lucide-react-native';

interface FeedVideoItemProps {
  content: any;
  onPress: () => void;
}

export default React.memo(function FeedVideoItem({ content, onPress }: FeedVideoItemProps) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-secondary rounded-xl overflow-hidden"
      activeOpacity={0.8}
    >
      <View className="h-48 bg-[#121212] relative">
        {content.fileUrl ? (
          <Image source={{ uri: content.fileUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center bg-[#1f2937]">
            <PlayCircle color="#6366f1" size={48} opacity={0.5} />
          </View>
        )}
        <View className="absolute inset-0 items-center justify-center bg-black/20">
          <PlayCircle color="#fff" size={40} />
        </View>
        {content.duration && (
          <View className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded">
            <Text className="text-white text-xs font-bold">{content.duration}</Text>
          </View>
        )}
        <View className="absolute top-2 left-2 bg-green-500 px-2 py-1 rounded">
          <Text className="text-white text-[10px] font-bold">FREE DEMO</Text>
        </View>
      </View>
      <View className="p-3">
        <Text className="text-text font-bold text-base" numberOfLines={2}>{content.title}</Text>
        <Text className="text-textMuted text-sm mt-1">{content.unit || 'Lecture'}</Text>
      </View>
    </TouchableOpacity>
  );
});
