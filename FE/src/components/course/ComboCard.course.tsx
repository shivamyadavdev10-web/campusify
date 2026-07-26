import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Layers } from 'lucide-react-native';
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';

interface ComboCardProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  isFree?: boolean;
  onPress: () => void;
}

const ComboCard: React.FC<ComboCardProps> = ({ title, subtitle, badgeText = "Free Access", isFree = true, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress} 
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <View style={styles.iconWrapper}>
        <Layers size={24} color={colors.primary} />
      </View>
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      
      {/* Dynamic Badge Rendering */}
      {badgeText ? (
        <View style={[styles.badge, !isFree && styles.paidBadge]}>
          <Text style={[styles.badgeText, !isFree && styles.paidBadgeText]}>
            {badgeText}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export default memo(ComboCard);

const styles = StyleSheet.create({
  card: { 
    width: 260, 
    backgroundColor: colors.surface, 
    borderRadius: 20, 
    padding: 20, 
    marginRight: 16, 
    borderWidth: 1, 
    borderColor: colors.border,
  },
  iconWrapper: { 
    width: 48, height: 48, 
    borderRadius: 12, 
    backgroundColor: colors.primaryLight, 
    alignItems: 'center', justifyContent: 'center', 
    marginBottom: 16 
  },
  title: { 
    fontSize: typography.size.lg, 
    fontFamily: typography.fontFamily.bold, 
    color: colors.textMain, 
    marginBottom: 6 
  },
  subtitle: { 
    fontSize: typography.size.sm, 
    color: colors.textMuted, 
    marginBottom: 16, 
    fontFamily: typography.fontFamily.regular 
  },
  badge: { 
    backgroundColor: colors.successLight, 
    alignSelf: 'flex-start', 
    paddingHorizontal: 10, paddingVertical: 4, 
    borderRadius: 8 
  },
  badgeText: { 
    color: colors.success, 
    fontSize: typography.size.xs, 
    fontFamily: typography.fontFamily.bold 
  },
  paidBadge: {
    backgroundColor: colors.primaryLight,
  },
  paidBadgeText: {
    color: colors.primary,
  }
});