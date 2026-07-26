// ✅ Added 'React' default import to prevent any JSX transform errors
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// 🟢 1. NAYA IMPORT: 'Lock' icon add kiya hai Reset Password ke liye
import { Phone, LogOut, ShieldCheck, Mail, BookOpen, ChevronRight, Receipt, Lock } from 'lucide-react-native';

import axiosClient from '../../api/axiosClient.api';
import { useAuthStore } from '../../store/useAuthStore';
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';
import { formatDate } from '../../utils/helpers.utils';
import { useQuery } from '@tanstack/react-query';

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const { logout, userProfile } = useAuthStore();
  
  // Tab State: 'courses' or 'payments'
  const [activeTab, setActiveTab] = useState('courses');
  
  // 🟢 2. NAYA STATE: Reset Password Loading State
  const [loadingReset, setLoadingReset] = useState(false);

  // Fallback to empty array if myCourses is undefined
  const myCourses = userProfile?.myCourses || [];

  // Fetch payments via React Query
  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['paymentsHistory'],
    queryFn: async () => {
      const response = await axiosClient.get('/user/payments');
      return response.data.status ? response.data.payments : [];
    },
    enabled: activeTab === 'payments', // Only fetch if payments tab is active
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });

  const handleSupport = () => {
    Linking.openURL('tel:+918104131420');
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive",
        onPress: async () => await logout()
      }
    ]);
  };

  // 🟢 3. NAYA FUNCTION: Reset Password API Call
  const handleInitiatePasswordReset = async () => {
    setLoadingReset(true);
    try {
        const response = await axiosClient.post('/auth/forgot-password', { 
            email: userProfile?.email 
        });

        if (response.data.status) {
            // Success hone par ResetPasswordScreen par bhejo (aur email pass karo)
            navigation.navigate('ResetPassword', { email: userProfile?.email });
        }
    } catch (error: any) {
        Alert.alert(
            'Error', 
            error.response?.data?.message || 'Could not send OTP. Please try again.'
        );
    } finally {
        setLoadingReset(false);
    }
  };

  const getInitials = () => {
    const first = userProfile?.firstName?.charAt(0) || '';
    const last = userProfile?.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  // ==========================================
  // 🎨 UI RENDERERS
  // ==========================================

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

  const renderPaymentCard = ({ item }: any) => (
    <View style={styles.card}>
      <View style={[styles.cardIconBox, { backgroundColor: colors.successLight }]}>
        <Receipt color={colors.success} size={24} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.semesterId?.title || 'Combo Course'}</Text>
        <Text style={styles.cardSub}>{formatDate(item.createdAt)} • Order ID: {item._id.slice(-6).toUpperCase()}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.amountText}>₹{item.amount}</Text>
        <Text style={[styles.statusText, item.status === 'Success' ? {color: colors.success} : {color: colors.danger}]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList 
        data={activeTab === 'courses' ? myCourses : payments}
        keyExtractor={(item, index) => item._id ? item._id.toString() : index.toString()}
        renderItem={activeTab === 'courses' ? renderCourseCard : renderPaymentCard}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* 👤 Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.nameText}>{userProfile?.firstName} {userProfile?.lastName}</Text>
                <View style={styles.row}>
                  <Mail color={colors.textMuted} size={14} style={styles.iconMargin} />
                  <Text style={styles.emailText}>{userProfile?.email}</Text>
                </View>
                <View style={styles.badge}>
                  <ShieldCheck color={colors.success} size={14} style={styles.iconMargin} />
                  <Text style={styles.badgeText}>Verified Student</Text>
                </View>
              </View>
            </View>

            {/* 🔴 Custom Tab Navigator (Courses | Payments) */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'courses' && styles.activeTab]}
                onPress={() => setActiveTab('courses')}
              >
                <Text style={[styles.tabText, activeTab === 'courses' && styles.activeTabText]}>COURSES</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'payments' && styles.activeTab]}
                onPress={() => setActiveTab('payments')}
              >
                <Text style={[styles.tabText, activeTab === 'payments' && styles.activeTabText]}>PAYMENTS</Text>
              </TouchableOpacity>
            </View>

            {/* Loading Indicator for Payments */}
            {activeTab === 'payments' && loadingPayments && (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loadingSpinner} />
            )}
          </>
        }
        ListEmptyComponent={
          loadingPayments ? null : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === 'courses' ? "You haven't purchased any courses yet." : "No payment history found."}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          <View style={styles.footerSection}>
            <Text style={styles.sectionTitle}>Account & Support</Text>

            {/* Menu Items */}
            <View style={styles.menuContainer}>
              {/* 1. Contact Support */}
              <TouchableOpacity style={styles.menuItem} onPress={handleSupport} activeOpacity={0.7}>
                <View style={[styles.menuIconBox, { backgroundColor: colors.successLight }]}>
                  <Phone color={colors.success} size={20} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Contact Support</Text>
                  <Text style={styles.menuSub}>Call: +91 8104131420</Text>
                </View>
              </TouchableOpacity>

              {/* 🟢 4. NAYA BUTTON: Reset Password */}
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={handleInitiatePasswordReset} 
                activeOpacity={0.7}
                disabled={loadingReset}
              >
                <View style={[styles.menuIconBox, { backgroundColor: colors.primaryLight }]}>
                  <Lock color={colors.primary} size={20} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Reset Password</Text>
                  <Text style={styles.menuSub}>Change your password securely via OTP</Text>
                </View>
                {/* Agar loading hai toh activity indicator dikhao */}
                {loadingReset && <ActivityIndicator size="small" color={colors.primary} />}
              </TouchableOpacity>

              {/* 3. Log Out */}
              <TouchableOpacity style={[styles.menuItem, styles.noBorder]} onPress={handleLogout} activeOpacity={0.7}>
                <View style={[styles.menuIconBox, { backgroundColor: colors.dangerLight }]}>
                  <LogOut color={colors.danger} size={20} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuTitle, { color: colors.danger }]}>Log Out</Text>
                  <Text style={styles.menuSub}>Securely sign out of this device</Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.versionText}>Campusify App v1.0.0</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  profileCard: { flexDirection: 'row', backgroundColor: colors.surface, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
  avatarBox: { width: 72, height: 72, backgroundColor: colors.primaryLight, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: typography.size.xxl, fontFamily: typography.fontFamily.extraBold, color: colors.primary },
  infoBox: { flex: 1, justifyContent: 'center' },
  nameText: { fontSize: typography.size.xl, fontFamily: typography.fontFamily.bold, color: colors.textMain, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  emailText: { fontSize: typography.size.sm, color: colors.textMuted, fontFamily: typography.fontFamily.regular },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successLight, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: colors.success, fontSize: typography.size.xs, fontFamily: typography.fontFamily.bold },
  iconMargin: { marginRight: 4 },
  loadingSpinner: { marginTop: 20 },
  amountContainer: { alignItems: 'flex-end' },
  noBorder: { borderBottomWidth: 0 },

  // --- NEW TAB STYLES ---
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 16 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: colors.primary }, 
  tabText: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.semiBold, color: colors.textLight },
  activeTabText: { color: colors.primary },

  // --- CARD STYLES (Shared by Courses and Payments) ---
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardIconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardInfo: { flex: 1, paddingRight: 8 },
  cardTitle: { fontSize: typography.size.md, fontFamily: typography.fontFamily.bold, color: colors.textMain, marginBottom: 4 },
  cardSub: { fontSize: typography.size.xs, color: colors.textMuted, fontFamily: typography.fontFamily.medium },
  
  // Payment Specific Text
  amountText: { fontSize: typography.size.md, fontFamily: typography.fontFamily.bold, color: colors.textMain },
  statusText: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.semiBold, marginTop: 2 },

  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontFamily: typography.fontFamily.medium, textAlign: 'center' },

  footerSection: { marginTop: 32 },
  sectionTitle: { fontSize: typography.size.md, fontFamily: typography.fontFamily.bold, color: colors.textMain, marginBottom: 12 },
  menuContainer: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.background },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: typography.size.md, fontFamily: typography.fontFamily.semiBold, color: colors.textMain, marginBottom: 2 },
  menuSub: { fontSize: typography.size.sm, color: colors.textMuted, fontFamily: typography.fontFamily.regular },
  
  versionText: { textAlign: 'center', color: colors.textLight, fontSize: typography.size.xs, marginTop: 40, fontFamily: typography.fontFamily.medium }
});