import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Layers, ChevronRight } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import axiosClient from '../../api/axiosClient.api';
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';

export default function SemesterScreen({ route, navigation }: any) {
  const { branchId, branchName } = route.params;

  const { data: semesters = [], isLoading } = useQuery({
    queryKey: ['semesters', branchId],
    queryFn: async () => {
      const response = await axiosClient.get(`/curriculum/semesters/${branchId}`);
      return response.data?.status ? response.data.semesters : [];
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  const renderSemesterCard = useCallback(({ item }: any) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('Subjects', { 
        semesterId: item._id, 
        semesterTitle: item.title 
      })}
    >
      <View style={styles.cardIconBox}>
        <Layers color={colors.primary} size={24} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSub}>Semester {item.semNumber}</Text>
      </View>
      <ChevronRight color={colors.textLight} size={20} />
    </TouchableOpacity>
  ), [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={24} color={colors.textMain} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{branchName}</Text>
          <Text style={styles.headerSub}>Select Semester</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={semesters}
          keyExtractor={(item) => item._id}
          renderItem={renderSemesterCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          windowSize={5}
          maxToRenderPerBatch={8}
          ListEmptyComponent={<Text style={styles.emptyText}>No semesters published yet.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 8, marginRight: 8, marginLeft: -8 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: typography.size.lg, fontFamily: typography.fontFamily.extraBold, color: colors.textMain },
  headerSub: { fontSize: typography.size.sm, color: colors.textMuted, fontFamily: typography.fontFamily.medium },
  listContent: { padding: 20, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardIconBox: { width: 48, height: 48, backgroundColor: colors.primaryLight, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: typography.size.md, fontFamily: typography.fontFamily.bold, color: colors.textMain, marginBottom: 4 },
  cardSub: { fontSize: typography.size.sm, color: colors.textMuted, fontFamily: typography.fontFamily.semiBold },
  emptyText: { textAlign: 'center', color: colors.textLight, marginTop: 40, fontFamily: typography.fontFamily.medium }
});