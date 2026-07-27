import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { DownloadCloud, PlayCircle, FileText, Trash2 } from 'lucide-react-native';

import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';
import Header from '../../components/layout/Header.layout';

export default function DownloadsScreen({ navigation }: { navigation: any }) {
  const [downloads, setDownloads] = useState<any[]>([]);

  // 🔄 Jab bhi bacha is tab par aayega, list refresh hogi
  useFocusEffect(
    useCallback(() => {
      loadDownloads();
    }, [])
  );

  const loadDownloads = async () => {
    try {
      const stored = await AsyncStorage.getItem('campusify_downloads');
      if (stored) {
        setDownloads(JSON.parse(stored));
      }
    } catch {
      console.log("Error loading downloads");
    }
  };

  // 🗑️ Delete Logic
  const handleDelete = (item: any) => {
    Alert.alert(
      "Delete Download",
      `Are you sure you want to delete "${item.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              // 1. File ko memory se udao
              await ReactNativeBlobUtil.fs.unlink(item.path).catch(() => {});
              
              // 2. Storage diary se entry hatao
              const updatedDownloads = downloads.filter(d => d.id !== item.id);
              await AsyncStorage.setItem('campusify_downloads', JSON.stringify(updatedDownloads));
              
              // 3. UI update karo
              setDownloads(updatedDownloads);
            } catch {
              Alert.alert("Error", "Could not delete the file.");
            }
          }
        }
      ]
    );
  };

  // 🃏 List Item Component
  const renderItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => {
        if (item.type === 'video') {
          navigation.navigate('VideoPlayer', { fileUrl: 'file://' + item.path, title: item.title });
        } else {
          navigation.navigate('PdfViewer', { documentId: item.id, title: item.title });
        }
      }}
    >
      <View style={[styles.cardIconBox, item.type === 'video' ? styles.iconVideo : styles.iconPdf]}>
        {item.type === 'video' ? (
          <PlayCircle color={colors.primary} size={28} />
        ) : (
          <FileText color={colors.danger} size={28} />
        )}
      </View>
      
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardSub}>
          {item.type === 'video' ? 'Video Lecture' : 'PDF Document'} • Offline
        </Text>
      </View>
      
      <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
        <Trash2 color={colors.textMuted} size={22} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <Header />

      <View style={styles.content}>
        <FlatList
          data={downloads}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={downloads.length > 0 ? styles.listContainer : styles.emptyContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            // 🎨 Aapka banaya hua Premium Empty State
            <View style={styles.emptyStateBox}>
              <View style={styles.iconCircle}>
                <DownloadCloud color={colors.primary} size={48} />
              </View>
              <Text style={styles.title}>No Downloads Yet</Text>
              <Text style={styles.subtitle}>
                Videos you download will securely appear here. 
                They are stored entirely on your device and will be deleted if you uninstall the app or log out.
              </Text>
              
              <TouchableOpacity 
                style={styles.browseButton}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('MyCoursesTab')}
              >
                <Text style={styles.browseButtonText}>Go to My Courses</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  
  // Dynamic List Styles
  listContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.surface, 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: colors.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardIconBox: { 
    width: 56, 
    height: 56, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  iconVideo: { backgroundColor: colors.primaryLight },
  iconPdf: { backgroundColor: '#FEE2E2' },
  cardInfo: { flex: 1, paddingRight: 8 },
  cardTitle: { fontSize: typography.size.md, fontFamily: typography.fontFamily.bold, color: colors.textMain, marginBottom: 4 },
  cardSub: { fontSize: typography.size.xs, color: colors.textMuted, fontFamily: typography.fontFamily.medium },
  deleteBtn: { padding: 8 },

  // Your Empty State Styles
  emptyStateBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: typography.size.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textMain,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  browseButtonText: {
    color: '#FFF',
    fontSize: typography.size.md,
    fontFamily: typography.fontFamily.bold,
  }
});