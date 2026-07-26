import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import axiosClient from '../../api/axiosClient.api';
import SubjectCard from '../../components/course/SubjectCard.course';
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';

export default function SubjectScreen({ route, navigation }: any) {
  const { semesterId, semesterTitle } = route.params;

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects', semesterId],
    queryFn: async () => {
      const response = await axiosClient.get(`/curriculum/subjects/${semesterId}`);
      return response.data?.status ? response.data.subjects : [];
    },
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  const renderSubjectCard = useCallback(({ item }: any) => (
    <SubjectCard 
      name={item.name}
      code={item.subjectCode}
      onPress={() => navigation.navigate('Contents', { 
        subjectId: item._id, 
        subjectName: item.name 
      })}
    />
  ), [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={24} color={colors.textMain} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{semesterTitle}</Text>
          <Text style={styles.headerSub}>Select Subject</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.success} style={styles.loader} />
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={(item) => item._id}
          renderItem={renderSubjectCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          windowSize={5}
          maxToRenderPerBatch={8}
          ListEmptyComponent={<Text style={styles.emptyText}>No subjects available right now.</Text>}
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
  emptyText: { textAlign: 'center', color: colors.textLight, marginTop: 40, fontFamily: typography.fontFamily.medium }
});