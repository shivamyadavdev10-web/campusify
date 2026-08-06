import React from 'react';
import { View, Text } from 'react-native';

export default function MyCoursesScreen() {
  return (
    <View className="flex-1 bg-white items-center justify-center">
      <Text className="text-xl font-bold text-[#0b1c30]">My Courses</Text>
      <Text className="text-[#737686] mt-2">Your enrolled courses will appear here.</Text>
    </View>
  );
}
