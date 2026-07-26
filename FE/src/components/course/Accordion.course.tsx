import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  initialExpanded?: boolean;
}

export default function Accordion({ title, children, initialExpanded = false }: AccordionProps) {
  const [expanded, setExpanded] = useState(initialExpanded);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header} 
        activeOpacity={0.7} 
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.icon}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
  },
  title: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.size.md,
    color: colors.textMain,
    flex: 1,
  },
  icon: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginLeft: 8,
  },
  content: {
    padding: 16,
    paddingTop: 8,
  }
});
