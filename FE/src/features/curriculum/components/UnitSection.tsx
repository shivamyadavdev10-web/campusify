import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import ContentItem from './ContentItem';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface UnitSectionProps {
  unitName: string;
  contents: any[];
  isSemesterPurchased: boolean;
  onContentPress: (content: any) => void;
  initialExpanded?: boolean;
}

export default React.memo(function UnitSection({ unitName, contents, isSemesterPurchased, onContentPress, initialExpanded = false }: UnitSectionProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View className="mb-4 bg-secondary rounded-xl overflow-hidden">
      <TouchableOpacity 
        className="flex-row justify-between items-center p-4 bg-[#1f2937]"
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <Text className="text-text font-bold text-base">{unitName}</Text>
        {isExpanded ? <ChevronUp color="#9ca3af" size={20} /> : <ChevronDown color="#9ca3af" size={20} />}
      </TouchableOpacity>
      
      {isExpanded && (
        <View className="p-2">
          {contents.map((content) => (
            <ContentItem 
              key={content._id} 
              content={content} 
              isSemesterPurchased={isSemesterPurchased}
              onPress={() => onContentPress(content)} 
            />
          ))}
        </View>
      )}
    </View>
  );
});
