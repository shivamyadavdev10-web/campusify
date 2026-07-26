import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import HomeScreen from '../../../src/screens/tabs/HomeScreen.tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axiosClient from '../../../src/api/axiosClient.api';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { Text, TouchableOpacity } from 'react-native';

jest.mock('../../../src/api/axiosClient.api', () => ({
  get: jest.fn(),
}));

const mockNavigation = {
  navigate: jest.fn(),
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('HomeScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await ReactTestRenderer.act(async () => {
      useAuthStore.setState({ 
        userProfile: { firstName: 'John', lastName: 'Doe' }
      });
    });
  });

  it('renders UI and mock featured courses', async () => {
    (axiosClient.get as jest.Mock).mockImplementation((url) => {
      if (url === '/curriculum/banner') {
        return Promise.resolve({ data: { status: true, banner: null } });
      }
      if (url === '/curriculum/branches') {
        return Promise.resolve({ data: { status: true, branches: [{ _id: 'b1', name: 'Computer Engineering', shortName: 'CO' }] } });
      }
      if (url === '/curriculum/contents/free') {
        return Promise.resolve({ data: { status: true, contents: [] } });
      }
      if (url === '/curriculum/courses/trending') {
        return Promise.resolve({ 
          data: { 
            status: true, 
            courses: [
              { _id: 'c1', title: 'React Native Crash Course', branchId: { shortName: 'CO' } },
              { _id: 'c2', title: 'Advanced Algorithms', branchId: { shortName: 'CO' } }
            ] 
          } 
        });
      }
      return Promise.resolve({ data: {} });
    });

    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <HomeScreen navigation={mockNavigation} />
        </QueryClientProvider>
      );
    });
    
    // Wait for the queries to resolve and re-render
    await ReactTestRenderer.act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100)); 
    });

    // Test: Home screen UI renders correctly (Dashboard Header title)
    const allTexts = root!.root.findAllByType(Text);
    expect(allTexts.some(node => node.props.children === '🆕 Latest Courses')).toBe(true);

    // Test: Mock featured/recent courses are displayed
    const hasCourse = allTexts.some(node => node.props.children === 'React Native Crash Course');
    expect(hasCourse).toBe(true);

    // Change Tab to 'branches'
    const branchesTab = allTexts.find(node => typeof node.props.children === 'object' && node.props.children[0] === 'Diploma');
    
    // Find the touchable wrapping the text
    let branchesBtn = branchesTab;
    while (branchesBtn && branchesBtn.type !== TouchableOpacity && branchesBtn.type !== 'View') {
      branchesBtn = branchesBtn.parent as any;
    }

    if (branchesBtn && branchesBtn.props.onPress) {
        await ReactTestRenderer.act(async () => {
            branchesBtn!.props.onPress();
        });
        
        // Wait for re-render
        await ReactTestRenderer.act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50)); 
        });

        const newTexts = root!.root.findAllByType(Text);
        expect(newTexts.some(node => node.props.children === '🎓 Available Branches')).toBe(true);
        expect(newTexts.some(node => node.props.children === 'Computer Engineering')).toBe(true);
    }
    await ReactTestRenderer.act(async () => {
      root!.unmount();
    });
  });
});
