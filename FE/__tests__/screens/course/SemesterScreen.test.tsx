import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import SemesterScreen from '../../../src/screens/course/SemesterScreen.course';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axiosClient from '../../../src/api/axiosClient.api';
import { Text, TouchableOpacity } from 'react-native';

jest.mock('../../../src/api/axiosClient.api', () => ({
  get: jest.fn(),
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: { branchId: 'branch-123', branchName: 'Computer Engineering' }
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

describe('SemesterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and fetches semesters based on branchId', async () => {
    (axiosClient.get as jest.Mock).mockResolvedValueOnce({
      data: {
        status: true,
        semesters: [
          { _id: 'sem-1', title: 'Semester 1', semNumber: 1 },
          { _id: 'sem-2', title: 'Semester 2', semNumber: 2 }
        ]
      }
    });

    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <SemesterScreen navigation={mockNavigation} route={mockRoute} />
        </QueryClientProvider>
      );
    });

    await ReactTestRenderer.act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(axiosClient.get).toHaveBeenCalledWith('/curriculum/semesters/branch-123');

    const allTexts = root!.root.findAllByType(Text);
    
    // Header should show Branch Name
    expect(allTexts.some(node => node.props.children === 'Computer Engineering')).toBe(true);
    
    // Semesters should be rendered
    expect(allTexts.some(node => node.props.children === 'Semester 1')).toBe(true);
    expect(allTexts.some(node => node.props.children === 'Semester 2')).toBe(true);
    
    // Test navigation on press
    const touchables = root!.root.findAllByType(TouchableOpacity as any);
    const sem1Button = touchables.find(btn => {
       const texts = btn.findAllByType(Text);
       return texts.some(t => t.props.children === 'Semester 1');
    });

    await ReactTestRenderer.act(async () => {
      sem1Button!.props.onPress();
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Subjects', { semesterId: 'sem-1', semesterTitle: 'Semester 1' });
    // Test empty state
    (axiosClient.get as jest.Mock).mockResolvedValueOnce({
      data: { status: true, semesters: [] }
    });

    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } }})}>
          <SemesterScreen navigation={mockNavigation} route={mockRoute} />
        </QueryClientProvider>
      );
    });

    await ReactTestRenderer.act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    
    const emptyTexts = root!.root.findAllByType(Text);
    expect(emptyTexts.some(node => node.props.children === 'No semesters published yet.')).toBe(true);
  });
});
