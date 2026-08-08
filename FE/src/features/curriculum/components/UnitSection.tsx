import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react-native';
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

  const videoCount = contents.filter(c => c.type === 'video').length;
  const pdfCount = contents.filter(c => c.type === 'pdf' || c.type === 'notes').length;

  return (
    <View style={styles.card}>
      {/* Accent strip */}
      <View style={styles.accentStrip} />

      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.unitIcon}>
            <BookOpen color="#4f46e5" size={16} strokeWidth={2.5} />
          </View>
          <View>
            <Text style={styles.unitTitle}>{unitName}</Text>
            <Text style={styles.unitMeta}>
              {videoCount > 0 && `${videoCount} video${videoCount > 1 ? 's' : ''}`}
              {videoCount > 0 && pdfCount > 0 && '  •  '}
              {pdfCount > 0 && `${pdfCount} file${pdfCount > 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>
        <View style={[styles.chevronCircle, isExpanded && styles.chevronActive]}>
          {isExpanded
            ? <ChevronUp color={isExpanded ? '#4f46e5' : '#64748b'} size={16} />
            : <ChevronDown color="#64748b" size={16} />
          }
        </View>
      </TouchableOpacity>

      {/* Content list */}
      {isExpanded && (
        <View style={styles.contentList}>
          <View style={styles.divider} />
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  accentStrip: {
    height: 3,
    backgroundColor: '#4f46e5',
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unitIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  unitTitle: {
    color: '#1e293b',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  unitMeta: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  chevronCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(100, 116, 139, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
  },
  contentList: {
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginHorizontal: 10,
    marginBottom: 4,
  },
});
