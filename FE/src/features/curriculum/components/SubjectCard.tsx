import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { FileText, ChevronRight } from 'lucide-react-native';

interface SubjectCardProps {
  subject: any;
  onPress: () => void;
}

const cardShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  android: { elevation: 2 },
  default: {},
});

export default React.memo(function SubjectCard({ subject, onPress }: SubjectCardProps) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-surface-container-lowest border border-outline-variant rounded-[16px] p-4 flex-row items-center active:scale-[0.97]"
      style={cardShadow}
      activeOpacity={0.7}
    >
      <View className="w-[44px] h-[44px] bg-[#f0f5ff] rounded-[12px] items-center justify-center mr-4">
        <FileText color="#4182f9" size={20} />
      </View>
      <View className="flex-1">
        <Text className="text-on-surface font-bold text-[15px] mb-0.5">{subject.name || 'Untitled Subject'}</Text>
        {subject.subjectCode && (
          <Text className="text-on-surface-variant text-[12px] uppercase font-medium">{subject.subjectCode}</Text>
        )}
      </View>
      <ChevronRight color="#c1c3ce" size={18} />
    </TouchableOpacity>
  );
});
