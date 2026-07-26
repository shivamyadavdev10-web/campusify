import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BookOpen, User, Download } from 'lucide-react-native';

import HomeScreen from '../screens/tabs/HomeScreen.tabs';
import MyCoursesScreen from '../screens/tabs/MyCoursesScreen.tabs';
import ProfileScreen from '../screens/tabs/ProfileScreen.tabs';
import DownloadsScreen from '../screens/tabs/DownloadsScreen.tabs';
import { colors } from '../theme/colors.theme';
import { typography } from '../theme/typography.theme';

const Tab = createBottomTabNavigator();

const HomeIcon = ({ color, size }: { color: string; size: number }) => <Home color={color} size={size} />;
const BookIcon = ({ color, size }: { color: string; size: number }) => <BookOpen color={color} size={size} />;
const DownloadIcon = ({ color, size }: { color: string; size: number }) => <Download color={color} size={size} />;
const UserIcon = ({ color, size }: { color: string; size: number }) => <User color={color} size={size} />;

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        lazy: true,
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: HomeIcon,
        }}
      />
      
      <Tab.Screen
        name="MyCoursesTab"
        component={MyCoursesScreen}
        options={{
          tabBarLabel: 'Courses',
          tabBarIcon: BookIcon,
        }}
      />

      <Tab.Screen
        name="DownloadsTab"
        component={DownloadsScreen}
        options={{
          tabBarLabel: 'Downloads',
          tabBarIcon: DownloadIcon,
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: UserIcon,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 85 : 70,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tabBarLabel: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.semiBold,
    marginTop: 4,
  },
});