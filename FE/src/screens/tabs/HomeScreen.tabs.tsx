

import React, { useState, useMemo, useCallback, memo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, ChevronRight, PlayCircle, Star, Layers, Filter, BookOpen, Clock, ChevronDown } from 'lucide-react-native'; 

import axiosClient from '../../api/axiosClient.api';
// import removed
import Header from '../../components/layout/Header.layout';
import SearchBar from '../../components/layout/SearchBar.layout';
import { debounce } from '../../utils/helpers.utils';
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';

// ==========================================
// 🚀 Custom Formatter for Branch Names
// ==========================================
const getFormattedBranchName = (shortName: string, originalName: string) => {
  switch(shortName) {
    case 'CO': return 'CO - Computer';
    case 'AN': return 'AI/AN - Artificial Intel.';
    case 'IT': return 'IT - Information Tech';
    case 'EJ': return 'EJ - Electronics';
    case 'CE': return 'CE - Civil';
    case 'ME': return 'ME - Mechanical';
    case 'EE': return 'EE - Electrical';
    case 'TE': return 'TE - Electronics & Computer';
    case 'ALL': return 'All Branches';
    default: return `${shortName} - ${originalName}`;
  }
};

// ==========================================
// 🚀 DYNAMIC Dashboard Header
// ==========================================
const DashboardHeader = memo(({ activeTab, setActiveTab, banner, navigation }: any) => {
  const getSectionTitle = () => {
    if (activeTab === 'branches') return "🎓 Available Branches";
    if (activeTab === 'free') return "▶️ Free Demo Lectures";
    return "🆕 Latest Courses"; 
  };

  return (
    <View style={styles.dashboardHeader}>
      {banner && banner.imageUrl ? (
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => {
            if (banner.actionUrl) {
              if (banner.actionUrl.startsWith('app://semester/')) {
                const parts = banner.actionUrl.split('/');
                const semesterId = parts[parts.length - 1];
                navigation.navigate('CourseFlow', { screen: 'Subjects', params: { semesterId: semesterId, semesterTitle: 'Special Offer' } });
              } else {
                Linking.openURL(banner.actionUrl).catch(() => console.log("Failed to open actionUrl"));
              }
            }
          }}
          style={styles.dynamicBannerContainer}
        >
          <Image 
            source={{ uri: banner.imageUrl }} 
            style={styles.dynamicBannerImage} 
            resizeMode="cover"
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.heroBanner}>
          <Text style={styles.heroBadge}>📢 New Launch: MSBTE Sem 3 Crash Course</Text>
          <Text style={styles.heroTitle}>Master your MSBTE & MU Exams</Text>
          <TouchableOpacity style={styles.heroBtn} activeOpacity={0.8}>
            <Text style={styles.heroBtnText}>Explore Combos</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.quickLinksGrid}>
        <TouchableOpacity style={styles.actionCard} activeOpacity={0.7} onPress={() => setActiveTab('branches')}>
          <View style={[styles.iconBox, activeTab === 'branches' ? styles.iconBoxActive : styles.iconBoxBlue]}>
            <Layers color={activeTab === 'branches' ? '#FFF' : '#3B82F6'} size={24} />
          </View>
          <Text style={[styles.actionText, activeTab === 'branches' && styles.actionTextActive]}>Diploma{"\n"}Courses</Text>
        </TouchableOpacity>
        
        {/* 🚀 Changed Trending to Latest Courses */}
        <TouchableOpacity style={styles.actionCard} activeOpacity={0.7} onPress={() => setActiveTab('latest')}>
          <View style={[styles.iconBox, activeTab === 'latest' ? styles.iconBoxActive : styles.iconBoxRed]}>
            <Clock color={activeTab === 'latest' ? '#FFF' : '#EF4444'} size={24} />
          </View>
          <Text style={[styles.actionText, activeTab === 'latest' && styles.actionTextActive]}>Latest{"\n"}Courses</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard} activeOpacity={0.7} onPress={() => setActiveTab('free')}>
          <View style={[styles.iconBox, activeTab === 'free' ? styles.iconBoxActive : styles.iconBoxGreen]}>
            <PlayCircle color={activeTab === 'free' ? '#FFF' : '#10B981'} size={24} />
          </View>
          <Text style={[styles.actionText, activeTab === 'free' && styles.actionTextActive]}>Demo{"\n"}Lectures</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <GraduationCap color="#3B82F6" size={20} style={styles.statIcon}/>
          <View><Text style={styles.statNumber}>2.7 Lakh+</Text><Text style={styles.statLabel}>Students Helped</Text></View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Star color="#F59E0B" fill="#F59E0B" size={20} style={styles.statIcon}/>
          <View><Text style={styles.statNumber}>4.8/5.0</Text><Text style={styles.statLabel}>Average Rating</Text></View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{getSectionTitle()}</Text>
    </View>
  );
});

// ==========================================
// 🎨 Filter Modal Item 
// ==========================================
const BranchModalItem = memo(({ item, isSelected, onSelect }: any) => {
  const displayText = getFormattedBranchName(item.shortName, item.name);
  return (
    <TouchableOpacity 
      style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
      onPress={() => onSelect(item._id)} activeOpacity={0.7}
    >
      <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
        {displayText}
      </Text>
    </TouchableOpacity>
  );
});

// ==========================================
// Main Screen Component
// ==========================================
export default function HomeScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState('latest'); 
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('all'); 
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // 🚀 REACT QUERY IMPLEMENTATION
  const { data: activeBanner = null } = useQuery({
    queryKey: ['banner'],
    queryFn: async () => {
      const res = await axiosClient.get('/curriculum/banner');
      return res.data?.status ? res.data.banner : null;
    }
  });

  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axiosClient.get('/curriculum/branches');
      return res.data.status ? res.data.branches : [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour for branches (rarely change)
  });

  const { data: freeContent = [], isLoading: freeLoading } = useQuery({
    queryKey: ['freeContent'],
    queryFn: async () => {
      const res = await axiosClient.get('/curriculum/contents/free');
      const contents = res.data?.status ? res.data.contents : [];
      
      contents.forEach((item: any) => {
        if (item.type?.toLowerCase() === 'video' || item.type?.toLowerCase() === 'video/mp4') {
          console.log('🐰 [FE] Fetched Free Video Link in HomeScreen:', item.fileUrl || item.url || item.videoUrl || item.sourceUrl);
        }
      });
      
      return contents;
    }
  });

  const { data: latestCourses = [], isLoading: latestLoading } = useQuery({
    queryKey: ['latestCourses'],
    queryFn: async () => {
      const res = await axiosClient.get('/curriculum/courses/trending');
      return res.data?.status ? res.data.courses.slice(0, 5) : [];
    }
  });

  const loading = branchesLoading || freeLoading || latestLoading;

  const fetchSearchResults = async (query: string, branchId: string) => {
    if (!query || query.trim() === '') return;
    try {
      setIsSearching(true);
      const response = await axiosClient.get(`/curriculum/search?q=${query}&branch=${branchId}`);
      if (response.data.status) setSearchResults(response.data.semesters);
    } catch (error) {
      console.log("Search API error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = useMemo(() => debounce((text, branch) => fetchSearchResults(text, branch), 400), []);

  const handleSearchChange = (text: string) => {
    setSearchText(text); 
    if (text.trim().length > 0) {
      debouncedSearch(text, selectedBranch); 
    } else {
      setSearchResults([]); 
    }
  };

  const handleBranchSelect = useCallback((branchId: string) => {
    setSelectedBranch(branchId);
    setIsFilterModalVisible(false);
    if (searchText.trim().length > 0) debouncedSearch(searchText, branchId);
  }, [searchText, debouncedSearch]);

  const renderItem = useCallback(({ item }: any) => {
    if (activeTab === 'free' || item.isFree) {
      return (
        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.8} 
          onPress={() => {
            if (item.type?.toLowerCase() === 'pdf' || item.type?.toLowerCase() === 'notes') {
              navigation.navigate('PdfViewer', { pdfId: item._id, documentId: item._id, title: item.title, fileUrl: item.fileUrl });
            } else if (item.type?.toLowerCase() === 'video' || item.type?.toLowerCase() === 'video/mp4') {
              const url = item.fileUrl || item.url || item.videoUrl || item.sourceUrl;
              console.log('🐰 [FE] HomeScreen clicked Video link:', url);
              navigation.navigate('VideoPlayer', { contentId: item._id, title: item.title });
            } else {
              if (item.subjectId) {
                navigation.navigate('CourseFlow', { 
                  screen: 'Contents', 
                  params: { 
                    subjectId: item.subjectId._id, 
                    subjectName: item.subjectId.name,
                    autoPlayVideo: item
                  } 
                });
              } else {
                navigation.navigate('CourseFlow', { 
                  screen: 'Contents', 
                  params: { 
                    subjectId: null, 
                    subjectName: item.title,
                    autoPlayVideo: item,
                    standaloneList: freeContent // Passes the list of free demo videos to show below
                  } 
                });
              }
            }
          }}
        >
          <View style={[styles.cardIconBox, styles.iconBoxRed]}>
            <PlayCircle color="#EF4444" size={24} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title || 'Demo Lecture'}</Text>
            <Text style={styles.cardSub}>Free Preview ▶</Text>
          </View>
          <ChevronRight color={colors.textLight} size={20} />
        </TouchableOpacity>
      );
    }

    if (item.shortName && activeTab === 'branches') {
      return (
        <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => navigation.navigate('CourseFlow', { screen: 'Semesters', params: { branchId: item._id, branchName: item.name } })}>
          <View style={styles.cardIconBox}>
            <GraduationCap color={colors.primary} size={24} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSub}>{item.shortName}</Text>
          </View>
          <ChevronRight color={colors.textLight} size={20} />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => navigation.navigate('CourseFlow', { screen: 'Subjects', params: { semesterId: item._id, semesterTitle: item.title } })}>
        <View style={[styles.cardIconBox, { backgroundColor: colors.warningLight }]}>
          <BookOpen color={colors.warning} size={24} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardSub}>{item.branchId?.shortName || 'Latest Course 🆕'}</Text>
        </View>
        <ChevronRight color={colors.textLight} size={20} />
      </TouchableOpacity>
    );
  }, [navigation, activeTab, freeContent]);

  const keyExtractor = useCallback((item: any, index: number) => item._id ? item._id.toString() : index.toString(), []);
  
  const renderEmptyComponent = useCallback(() => {
    let emptyMsg = "No data found.";
    if (searchText.length > 0) emptyMsg = isSearching ? "Searching..." : "No courses match your search.";
    else if (activeTab === 'branches') emptyMsg = "No branches available.";
    else if (activeTab === 'free') emptyMsg = "Free demo lectures are coming soon!";
    else if (activeTab === 'latest') emptyMsg = "New courses are being updated!";
    
    return <Text style={styles.emptyText}>{emptyMsg}</Text>;
  }, [isSearching, searchText, activeTab]);

  const getItemLayout = useCallback((data: any, index: number) => ({ length: 94, offset: 94 * index, index }), []);

  const listData = useMemo(() => {
    if (searchText.length > 0) return searchResults;
    if (activeTab === 'branches') return branches;
    if (activeTab === 'free') return freeContent;
    return latestCourses; // 👈 Only the top 5 will be passed here!
  }, [searchText, searchResults, activeTab, branches, freeContent, latestCourses]);
  
  const selectedBranchDisplay = useMemo(() => {
    if (selectedBranch === 'all') return 'All Branches';
    const found = branches.find(b => b._id === selectedBranch);
    if (!found) return 'All Branches';
    return found.shortName === 'AN' ? 'AI/AN' : found.shortName;
  }, [selectedBranch, branches]);

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      
      <Header />

      <View style={styles.searchRow}>
        <View style={styles.searchWrapper}>
          <SearchBar 
            placeholder="Search Semesters..."
            value={searchText}
            onChangeText={handleSearchChange}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.dropdownBtn} 
          onPress={() => setIsFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Filter color="#64748B" size={16} />
          <Text style={styles.dropdownBtnText} numberOfLines={1}>
            {selectedBranchDisplay}
          </Text>
          <ChevronDown color="#64748B" size={16} />
        </TouchableOpacity>
      </View>

      {/* Removed ActivityIndicator to enable smooth invisible fetching syncing with real data */}
      <FlatList
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={searchText.length === 0 ? <DashboardHeader activeTab={activeTab} setActiveTab={setActiveTab} banner={activeBanner} navigation={navigation} /> : null}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            renderEmptyComponent
          )
        }
        getItemLayout={getItemLayout}
        initialNumToRender={8}          
        maxToRenderPerBatch={10}        
        windowSize={5}                  
        removeClippedSubviews={true}    
        keyboardShouldPersistTaps="handled"
      />

      <Modal visible={isFilterModalVisible} animationType="fade" transparent={true} onRequestClose={() => setIsFilterModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsFilterModalVisible(false)}>
          <View style={styles.dropdownMenu}>
            
            <FlatList
              data={[{ _id: 'all', name: 'All Branches', shortName: 'ALL' }, ...branches]}
              keyExtractor={(item) => item._id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <BranchModalItem 
                  item={item} 
                  isSelected={selectedBranch === item._id}
                  onSelect={handleBranchSelect}
                />
              )}
            />

          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: 40 },
  listContent: { paddingBottom: 100 },
  
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16, gap: 10 },
  searchWrapper: { flex: 1, height: 50 },
  dropdownBtn: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', 
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, 
    paddingHorizontal: 12, height: 50, minWidth: 110, justifyContent: 'center', gap: 8 
  },
  dropdownBtnText: { fontFamily: typography.fontFamily.semiBold, color: '#334155', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  dropdownMenu: { 
    backgroundColor: '#FFF', width: '85%', maxHeight: '70%', borderRadius: 12, overflow: 'hidden', 
    elevation: 10, shadowColor: '#000', shadowOffset: { height: 4, width: 0 }, shadowOpacity: 0.2, shadowRadius: 10 
  },
  dropdownItem: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownItemSelected: { backgroundColor: '#2563EB' }, 
  dropdownItemText: { fontSize: 14, fontFamily: typography.fontFamily.medium, color: '#334155' },
  dropdownItemTextSelected: { color: '#FFFFFF', fontFamily: typography.fontFamily.bold },

  dashboardHeader: { paddingTop: 10 },
  
  // DYNAMIC BANNER
  dynamicBannerContainer: { marginHorizontal: 20, marginBottom: 25, borderRadius: 16, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, backgroundColor: '#FFF' },
  dynamicBannerImage: { width: '100%', aspectRatio: 16/9, backgroundColor: colors.surface },
  
  // STATIC BANNER (Fallback)
  heroBanner: { backgroundColor: colors.primary, marginHorizontal: 20, borderRadius: 24, padding: 24, marginBottom: 25 },
  heroBadge: { color: '#FFF', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, fontSize: typography.size.xs, fontFamily: typography.fontFamily.bold, overflow: 'hidden', marginBottom: 12 },
  heroTitle: { color: '#FFF', fontSize: typography.size.xl, fontFamily: typography.fontFamily.bold, marginBottom: 16, lineHeight: 32 },
  heroBtn: { backgroundColor: '#FFF', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignSelf: 'flex-start' },
  heroBtnText: { color: colors.primary, fontFamily: typography.fontFamily.bold, fontSize: typography.size.sm },
  
  quickLinksGrid: { flexDirection: 'row', justifyContent: 'space-evenly', paddingHorizontal: 10, marginBottom: 25 },
  actionCard: { alignItems: 'center', width: '30%' },
  iconBox: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  iconBoxActive: { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  iconBoxBlue: { backgroundColor: '#EFF6FF' },
  iconBoxRed: { backgroundColor: '#FEF2F2' },
  iconBoxGreen: { backgroundColor: '#ECFDF5' },
  actionText: { fontSize: 11, fontFamily: typography.fontFamily.semiBold, color: colors.textMain, textAlign: 'center' },
  actionTextActive: { color: colors.primary, fontFamily: typography.fontFamily.bold },
  
  statsContainer: { flexDirection: 'row', backgroundColor: colors.surface, marginHorizontal: 20, borderRadius: 20, padding: 15, marginBottom: 30, borderWidth: 1, borderColor: colors.border },
  statBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 10 },
  statNumber: { fontSize: typography.size.md, fontFamily: typography.fontFamily.bold, color: colors.textMain },
  statLabel: { fontSize: 10, color: colors.textMuted, fontFamily: typography.fontFamily.medium },
  statIcon: { marginRight: 8 },
  
  sectionTitle: { fontSize: typography.size.lg, fontFamily: typography.fontFamily.bold, color: colors.textMain, marginHorizontal: 20, marginBottom: 16 },
  
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, marginHorizontal: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardIconBox: { width: 48, height: 48, backgroundColor: colors.primaryLight, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: typography.size.md, fontFamily: typography.fontFamily.bold, color: colors.textMain, marginBottom: 4 },
  cardSub: { fontSize: typography.size.sm, color: colors.textMuted, fontFamily: typography.fontFamily.semiBold },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 20, fontFamily: typography.fontFamily.medium }
});