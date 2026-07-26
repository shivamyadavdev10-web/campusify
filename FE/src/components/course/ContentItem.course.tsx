import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PlayCircle, FileText, Link as LinkIcon, Lock } from 'lucide-react-native'; // 🚨 Lock icon imported
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';

interface ContentItemProps {
  title: string;
  type: 'video' | 'pdf' | string;
  duration?: string;
  onPress: () => void;
  isLoading?: boolean;
  isLocked?: boolean;
}

const ContentItem: React.FC<ContentItemProps> = ({ title, type, duration, onPress, isLoading, isLocked }) => {
  const isVideo = type === 'video';
  const isPdf = type === 'pdf';

  // Dynamic icon based on type and lock status
  const renderIcon = () => {
    if (isLocked) return <Lock color={colors.textMuted} size={24} />; // 🔒 Show lock if locked
    if (isVideo) return <PlayCircle color={colors.primary} size={24} />;
    if (isPdf) return <FileText color={colors.warning} size={24} />;
    return <LinkIcon color={colors.textLight} size={24} />; // Fallback
  };

  return (
    <TouchableOpacity 
      style={[styles.card, isLocked && styles.cardLocked]} // Apply locked styles
      onPress={onPress}
      disabled={isLoading || isLocked} // 🚨 Disable click if locked
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ busy: isLoading, disabled: isLocked }}
    >
      <View style={[
        styles.cardIconBox, 
        isLocked ? styles.iconLocked : isVideo ? styles.iconVideo : isPdf ? styles.iconPdf : styles.iconFallback
      ]}>
        {renderIcon()}
      </View>
      
      <View style={styles.cardInfo}>
        <Text style={[styles.cardTitle, isLocked && styles.textLockedTitle]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.cardSub}>
          {isVideo ? `Video • ${duration || 'N/A'}` : isPdf ? 'PDF Document' : 'Resource'}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <View style={[
          styles.actionBtn, 
          isLocked ? styles.actionLocked : isVideo ? styles.actionVideo : isPdf ? styles.actionPdf : styles.actionFallback
        ]}>
          <Text style={[
            styles.actionText, 
            isLocked ? styles.textLockedBtn : isVideo ? styles.textVideo : isPdf ? styles.textPdf : styles.textFallback
          ]}>
            {isLocked ? 'Locked' : isVideo ? 'Play' : isPdf ? 'View' : 'Open'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default memo(ContentItem);

const styles = StyleSheet.create({
  card: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: colors.surface, 
    padding: 16, borderRadius: 16, 
    marginBottom: 12, 
    borderWidth: 1, borderColor: colors.border 
  },
  cardLocked: { // 🚨 Visual feedback for locked state
    backgroundColor: '#FAFAFA', 
    borderColor: '#F3F4F6',
    opacity: 0.8
  },
  cardIconBox: { 
    width: 48, height: 48, 
    borderRadius: 12, justifyContent: 'center', alignItems: 'center', 
    marginRight: 16 
  },
  iconVideo: { backgroundColor: colors.primaryLight },
  iconPdf: { backgroundColor: colors.warningLight },
  iconLocked: { backgroundColor: '#F3F4F6' },
  iconFallback: { backgroundColor: colors.border },
  
  cardInfo: { flex: 1, marginRight: 8 },
  cardTitle: { 
    fontSize: typography.size.sm + 1, 
    fontFamily: typography.fontFamily.bold, 
    color: colors.textMain, 
    marginBottom: 4 
  },
  textLockedTitle: { color: colors.textMuted },
  cardSub: { 
    fontSize: typography.size.xs, 
    color: colors.textMuted, 
    fontFamily: typography.fontFamily.medium 
  },
  
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionVideo: { backgroundColor: colors.primaryLight },
  actionPdf: { backgroundColor: colors.warningLight },
  actionLocked: { backgroundColor: '#F3F4F6' },
  actionFallback: { backgroundColor: colors.border },
  
  actionText: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.bold },
  textVideo: { color: colors.primary },
  textPdf: { color: colors.warning },
  textLockedBtn: { color: colors.textMuted },
  textFallback: { color: colors.textMuted }
});