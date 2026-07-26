import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import CourseStack from '../../src/navigation/CourseStack.navigation';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@react-navigation/native-stack', () => {
  return {
    createNativeStackNavigator: jest.fn(() => ({
      Navigator: ({ children }: any) => <>{children}</>,
      Screen: ({ component: Component }: any) => <Component />
    })),
  };
});

jest.mock('../../src/screens/course/SemesterScreen.course', () => {
  const { View } = require('react-native');
  return () => <View testID="SemesterScreen" />;
});
jest.mock('../../src/screens/course/SubjectScreen.course', () => () => null);
jest.mock('../../src/screens/course/ContentScreen.course', () => () => null);

describe('CourseStack', () => {
  it('renders correctly and defaults to Semesters screen', async () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(
        <NavigationContainer>
          <CourseStack />
        </NavigationContainer>
      );
    });

    expect(root!.root.findByProps({ testID: 'SemesterScreen' })).toBeTruthy();
  });
});
