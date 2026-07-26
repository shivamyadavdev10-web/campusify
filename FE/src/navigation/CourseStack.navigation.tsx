import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SemesterScreen from '../screens/course/SemesterScreen.course';
import SubjectScreen from '../screens/course/SubjectScreen.course';
import ContentScreen from '../screens/course/ContentScreen.course'; 

const Stack = createNativeStackNavigator();

export default function CourseStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Semesters" component={SemesterScreen} />
      <Stack.Screen name="Subjects" component={SubjectScreen} />
      <Stack.Screen name="Contents" component={ContentScreen} />
    </Stack.Navigator>
  );
}