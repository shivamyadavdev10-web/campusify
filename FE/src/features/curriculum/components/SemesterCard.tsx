import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

interface SemesterCardProps {
  semester: any;
  onPress: () => void;
}

export default React.memo(function SemesterCard({ semester, onPress }: SemesterCardProps) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-secondary rounded-xl overflow-hidden w-40 border border-[#1f2937]"
      activeOpacity={0.7}
    >
      <View className="h-28 bg-[#121212]">
        {semester.thumbnail ? (
          <Image source={{ uri: semester.thumbnail }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center bg-[#1f2937]">
            <Text className="text-textMuted font-bold">Sem {semester.semNumber}</Text>
          </View>
        )}
      </View>
      <View className="p-3">
        <Text className="text-text font-bold text-sm mb-1" numberOfLines={2}>
          {semester.title || `Semester ${semester.semNumber}`}
        </Text>
        <Text className="text-primary font-bold mt-1">
          {semester.price === 0 ? 'Free' : `₹${semester.price}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
});
