import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import axiosClient from '../../api/axiosClient.api';
import ContentItem from '../../components/course/ContentItem.course';
import Accordion from '../../components/course/Accordion.course';
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';

export default function ContentScreen({ route, navigation }: any) {
  const { subjectId, subjectName, standaloneList } = route.params || {};

  // --- DATA FETCHING ---
  const { data, isLoading } = useQuery({
    queryKey: ['contents', subjectId],
    queryFn: async () => {
      const response = await axiosClient.get(`/curriculum/contents/${subjectId}`);
      const fetchedContents = response.data?.contents || [];
      
      fetchedContents.forEach((item: any) => {
        if (item.type?.toLowerCase() === 'video' || item.type?.toLowerCase() === 'video/mp4') {
          console.log('🐰 [FE] Fetched Video Link in ContentScreen:', item.fileUrl || item.url || item.videoUrl || item.sourceUrl);
        }
      });

      return {
        contents: fetchedContents,
        isPurchased: response.data?.isSemesterPurchased || false,
      };
    },
    enabled: !!subjectId,
  });

  const isPurchased = data?.isPurchased || false;

  // Group PDFs by category, Videos by Unit
  const groupedData = useMemo(() => {
    const currentContents = standaloneList ? standaloneList : data?.contents || [];
    
    const categories: Record<string, any[]> = {};
    const units: Record<string, any[]> = {};

    currentContents.forEach((c: any) => {
      const type = c.type?.toLowerCase();
      if (type === 'pdf' || type === 'notes') {
        const cat = c.category || 'Resources';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(c);
      } else if (type === 'video') {
        const unit = c.unit || 'Other Videos';
        if (!units[unit]) units[unit] = [];
        units[unit].push(c);
      }
    });

    const result = [];
    // Push Categories first
    for (const cat in categories) {
      result.push({ id: `cat_${cat}`, isAccordion: false, title: cat, data: categories[cat] });
    }
    // Push Units next
    for (const unit in units) {
      result.push({ id: `unit_${unit}`, isAccordion: true, title: unit, data: units[unit] });
    }

    return result;
  }, [standaloneList, data?.contents]);

  // --- CONTENT LIST METHODS ---
  const handlePlayContent = useCallback((item: any) => {
    const isItemLocked = !isPurchased && !item.isFree;
    if (isItemLocked) {
      Alert.alert("Locked 🔒", "Purchase this semester to unlock premium content.");
      return;
    }
    
    const contentType = item.type?.toLowerCase();
    
    if (contentType === 'pdf' || contentType === 'notes') {
      const documentId = item._id || item.id;
      if (!documentId) {
        Alert.alert('Error', 'Document ID is missing from backend data');
        return;
      }
      navigation.navigate('PdfViewer', { documentId, title: item.title });
    } else if (contentType === 'video') {
      const contentId = item._id || item.id;
      if (!contentId) {
        Alert.alert('Error', 'Video ID is missing from backend data');
        return;
      }
      const url = item.fileUrl || item.url || item.videoUrl || item.sourceUrl;
      console.log('🐰 [FE] ContentScreen clicked Video link:', url);
      console.log("🔥 CLICKED ITEM DATA:", JSON.stringify(item, null, 2));
      navigation.navigate('VideoPlayer', { contentId, title: item.title });
    } else {
      Alert.alert("Notice", "Unsupported content type.");
    }
  }, [navigation, isPurchased]);

  const renderGroup = useCallback(({ item }: any) => {
    if (item.isAccordion) {
      return (
        <Accordion title={item.title}>
          {item.data.map((content: any) => {
            const isItemLocked = !isPurchased && !content.isFree;
            return (
              <ContentItem 
                key={content._id}
                title={content.title} 
                type={content.type} 
                duration={content.duration} 
                isLocked={isItemLocked}
                onPress={() => handlePlayContent(content)} 
              />
            );
          })}
        </Accordion>
      );
    } else {
      return (
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryTitle}>{item.title}</Text>
          {item.data.map((content: any) => {
            const isItemLocked = !isPurchased && !content.isFree;
            return (
              <ContentItem 
                key={content._id}
                title={content.title} 
                type={content.type} 
                duration={content.duration} 
                isLocked={isItemLocked}
                onPress={() => handlePlayContent(content)} 
              />
            );
          })}
        </View>
      );
    }
  }, [handlePlayContent, isPurchased]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{subjectName || 'Resources'}</Text>
      </View>

      <View style={styles.contentContainer}>
        {isLoading && !standaloneList ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={groupedData}
            keyExtractor={(item) => item.id}
            renderItem={renderGroup}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.emptyText}>No content available yet.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: typography.size.xl, fontFamily: typography.fontFamily.bold, color: colors.textMain },
  contentContainer: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 },
  emptyText: { textAlign: 'center', marginTop: 40, color: colors.textMuted, fontFamily: typography.fontFamily.medium },
  loader: { marginTop: 50 },
  categoryContainer: { marginBottom: 16 },
  categoryTitle: { 
    fontSize: typography.size.lg, 
    fontFamily: typography.fontFamily.bold, 
    color: colors.textMain,
    marginBottom: 12,
    marginLeft: 4,
  }
});