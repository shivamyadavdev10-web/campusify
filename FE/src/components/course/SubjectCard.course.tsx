import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BookOpen, ChevronRight } from 'lucide-react-native';
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';

interface SubjectCardProps {
  name: string;
  code?: string;
  onPress: () => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ name, code, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress} 
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <View style={styles.cardIconBox}>
        <BookOpen color={colors.success} size={24} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>{name}</Text>
        <Text style={styles.cardSub}>Code: {code || 'N/A'}</Text>
      </View>
      <ChevronRight color={colors.textLight} size={20} />
    </TouchableOpacity>
  );
}

export default memo(SubjectCard);

const styles = StyleSheet.create({
  card: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: colors.surface, 
    padding: 16, borderRadius: 16, 
    marginBottom: 12, 
    borderWidth: 1, borderColor: colors.border 
  },
  cardIconBox: { 
    width: 48, height: 48, 
    backgroundColor: colors.successLight, borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center', 
    marginRight: 16 
  },
  cardInfo: { flex: 1 },
  cardTitle: { 
    fontSize: typography.size.md, 
    fontFamily: typography.fontFamily.bold, 
    color: colors.textMain, 
    marginBottom: 4 
  },
  cardSub: { 
    fontSize: typography.size.sm, 
    color: colors.textMuted, 
    fontFamily: typography.fontFamily.medium 
  },
});