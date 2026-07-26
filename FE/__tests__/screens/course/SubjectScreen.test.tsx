import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import SubjectScreen from '../../../src/screens/course/SubjectScreen.course';
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
  params: { semesterId: 'sem-123', semesterTitle: 'Semester 1' }
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

describe('SubjectScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and fetches subjects based on semesterId', async () => {
    (axiosClient.get as jest.Mock).mockResolvedValueOnce({
      data: {
        status: true,
        subjects: [
          { _id: 'sub-1', name: 'Mathematics' },
          { _id: 'sub-2', name: 'Physics' }
        ]
      }
    });

    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <SubjectScreen navigation={mockNavigation} route={mockRoute} />
        </QueryClientProvider>
      );
    });

    await ReactTestRenderer.act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(axiosClient.get).toHaveBeenCalledWith('/curriculum/subjects/sem-123');

    const allTexts = root!.root.findAllByType(Text);
    
    // Header should show Semester Name
    expect(allTexts.some(node => node.props.children === 'Semester 1')).toBe(true);
    
    // Subjects should be rendered
    expect(allTexts.some(node => node.props.children === 'Mathematics')).toBe(true);
    expect(allTexts.some(node => node.props.children === 'Physics')).toBe(true);
    
    // Test navigation on press
    const touchables = root!.root.findAllByType(TouchableOpacity as any);
    const mathButton = touchables.find(btn => {
       const texts = btn.findAllByType(Text);
       return texts.some(t => t.props.children === 'Mathematics');
    });

    await ReactTestRenderer.act(async () => {
      mathButton!.props.onPress();
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Contents', { subjectId: 'sub-1', subjectName: 'Mathematics' });
    // Test empty state
    (axiosClient.get as jest.Mock).mockResolvedValueOnce({
      data: { status: true, subjects: [] }
    });

    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } }})}>
          <SubjectScreen navigation={mockNavigation} route={mockRoute} />
        </QueryClientProvider>
      );
    });
    
    await ReactTestRenderer.act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    
    const emptyTexts = root!.root.findAllByType(Text);
    expect(emptyTexts.some(node => node.props.children === 'No subjects available right now.')).toBe(true);
  });
});
