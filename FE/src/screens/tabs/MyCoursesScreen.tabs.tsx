import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, ChevronRight } from 'lucide-react-native';

import { useAuthStore } from '../../store/useAuthStore';
import Header from '../../components/layout/Header.layout';
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';

export default function MyCoursesScreen({ navigation }: { navigation: any }) {
  const { userProfile } = useAuthStore();
  const myCourses = userProfile?.myCourses || [];

  const renderCourseCard = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('CourseFlow', { 
        screen: 'Subjects', 
        params: { semesterId: item._id, semesterTitle: item.title } 
      })}
    >
      <View style={[styles.cardIconBox, { backgroundColor: colors.primaryLight }]}>
        <BookOpen color={colors.primary} size={24} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSub}>ID: {item._id.slice(-6).toUpperCase()} • Purchased</Text>
      </View>
      <ChevronRight color={colors.textLight} size={20} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <Header />

      <FlatList 
        data={myCourses}
        keyExtractor={(item, index) => item._id ? item._id.toString() : index.toString()}
        renderItem={renderCourseCard}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              You haven't purchased any courses yet. Explore trending courses on the home screen!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardIconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardInfo: { flex: 1, paddingRight: 8 },
  cardTitle: { fontSize: typography.size.md, fontFamily: typography.fontFamily.bold, color: colors.textMain, marginBottom: 4 },
  cardSub: { fontSize: typography.size.xs, color: colors.textMuted, fontFamily: typography.fontFamily.medium },

  emptyContainer: { padding: 40, alignItems: 'center', marginTop: 40 },
  emptyText: { color: colors.textMuted, fontFamily: typography.fontFamily.medium, textAlign: 'center', lineHeight: 22 }
});