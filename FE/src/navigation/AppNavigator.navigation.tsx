import { View, ActivityIndicator, StatusBar, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


// Screen & Context Imports
import AuthNavigator from './AuthNavigator.navigation';
import TabNavigator from './TabNavigator.navigation';
import CourseStack from './CourseStack.navigation'; 
import { useAuthStore } from '../store/useAuthStore';
import { colors } from '../theme/colors.theme';

// Fullscreen Players
import PdfViewerScreen from '../screens/player/PdfViewerScreen.player';
import VideoPlayerScreen from '../screens/player/VideoPlayerScreen.player';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isLoading, userToken } = useAuthStore();


  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken === null ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="CourseFlow" component={CourseStack} />
            <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
            <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
          </>
        )}
      </Stack.Navigator>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
