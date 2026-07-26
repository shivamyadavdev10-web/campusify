import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';

export default function Header() {
  const insets = useSafeAreaInsets(); // Dynamic safe area for modern screens

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      
      {/* 🚀 NEW: Styled Campusify Logo replacing the Greeting */}
      <TouchableOpacity 
        activeOpacity={0.7} 
      >
        <Text style={styles.logoText}>
          Campusify<Text style={styles.logoDot}>.</Text>
        </Text>
      </TouchableOpacity>

      
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingBottom: 15, // Thoda extra space logo ke niche acha lagta hai
    backgroundColor: 'rgba(249, 250, 251, 0.95)', 
    zIndex: 10
  },
  
  // 🎨 Logo Styles exactly matching your image
  logoText: {
    fontSize: 28, 
    fontFamily: typography.fontFamily.extraBold, 
    color: '#0F172A', // Dark Navy/Black color from the screenshot
    letterSpacing: -0.5,
  },
  logoDot: {
    color: '#F59E0B', // Campusify Yellow/Orange Dot
  },

  iconBtn: { 
    width: 44, 
    height: 44, 
    backgroundColor: colors.surface, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: colors.border 
  },
});