
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screen Imports
import LoginScreen from '../screens/auth/LoginScreen.auth';
import RegisterScreen from '../screens/auth/RegisterScreen.auth';
import OtpScreen from '../screens/auth/OtpScreen.auth';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen.auth';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen.auth';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OtpVerification" component={OtpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}