import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { PlayCircle, FileText, Lock, Clock, BookOpen, Sparkles } from 'lucide-react-native';

interface ContentItemProps {
  content: any;
  isSemesterPurchased: boolean;
  onPress: () => void;
}

const typeConfig: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  video: { icon: PlayCircle, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.15)' },
  pdf: { icon: FileText, color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.2)' },
  notes: { icon: BookOpen, color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.2)' },
};

export default React.memo(function ContentItem({ content, isSemesterPurchased, onPress }: ContentItemProps) {
  const isLocked = content.isLocked && !content.isFree && !isSemesterPurchased;
  const config = typeConfig[content.type] || typeConfig.video;
  const Icon = config.icon;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        isLocked && styles.locked,
      ]}
      activeOpacity={0.7}
    >
      {/* Icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: isLocked ? 'rgba(156, 163, 175, 0.08)' : config.bg, borderColor: isLocked ? 'rgba(156, 163, 175, 0.15)' : config.border }]}>
        <Icon color={isLocked ? '#6b7280' : config.color} size={18} strokeWidth={2} />
      </View>

      {/* Content info */}
      <View style={styles.info}>
        <Text style={[styles.title, isLocked && styles.lockedText]} numberOfLines={1}>
          {content.title}
        </Text>
        <View style={styles.metaRow}>
          {content.duration && (
            <View style={styles.chip}>
              <Clock color="#64748b" size={10} />
              <Text style={styles.chipText}>{content.duration}</Text>
            </View>
          )}
          {content.isFree && !isSemesterPurchased && (
            <View style={styles.freeBadge}>
              <Sparkles color="#22c55e" size={9} />
              <Text style={styles.freeText}>FREE</Text>
            </View>
          )}
          {content.type === 'video' && !content.duration && (
            <View style={styles.chip}>
              <PlayCircle color="#64748b" size={10} />
              <Text style={styles.chipText}>Video</Text>
            </View>
          )}
        </View>
      </View>

      {/* Lock or play indicator */}
      {isLocked ? (
        <View style={styles.lockBadge}>
          <Lock color="#9ca3af" size={14} />
        </View>
      ) : content.type === 'video' ? (
        <View style={[styles.playBadge, { backgroundColor: config.bg }]}>
          <PlayCircle color={config.color} size={16} fill={config.bg} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 2,
    backgroundColor: 'transparent',
  },
  locked: {
    opacity: 0.5,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: '#1e293b',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.1,
  },
  lockedText: {
    color: '#94a3b8',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipText: {
    color: '#64748b',
    fontSize: 11,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  freeText: {
    color: '#22c55e',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  lockBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
