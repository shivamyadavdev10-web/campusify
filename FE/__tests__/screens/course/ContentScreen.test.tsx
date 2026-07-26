import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import ContentScreen from '../../../src/screens/course/ContentScreen.course';
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
  params: { subjectId: 'sub-123', subjectName: 'Mathematics' }
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

describe('ContentScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and fetches contents based on subjectId', async () => {
    (axiosClient.get as jest.Mock).mockResolvedValueOnce({
      data: {
        status: true,
        contents: [
          { _id: 'c-1', title: 'Chapter 1 Video', type: 'video' },
          { _id: 'c-2', title: 'Chapter 1 Notes', type: 'pdf' }
        ]
      }
    });

    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <ContentScreen navigation={mockNavigation} route={mockRoute} />
        </QueryClientProvider>
      );
    });

    await ReactTestRenderer.act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(axiosClient.get).toHaveBeenCalledWith('/curriculum/contents/sub-123');

    const allTexts = root!.root.findAllByType(Text);
    
    // Header should show Subject Name
    expect(allTexts.some(node => node.props.children === 'Mathematics')).toBe(true);
    
    // Contents should be rendered
    expect(allTexts.some(node => node.props.children === 'Chapter 1 Video')).toBe(true);
    expect(allTexts.some(node => node.props.children === 'Chapter 1 Notes')).toBe(true);
    
    // Test empty state
    (axiosClient.get as jest.Mock).mockResolvedValueOnce({
      data: { status: true, contents: [] }
    });

    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } }})}>
          <ContentScreen navigation={mockNavigation} route={mockRoute} />
        </QueryClientProvider>
      );
    });
    
    await ReactTestRenderer.act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    
    const newTexts = root!.root.findAllByType(Text);
    expect(newTexts.some(node => node.props.children === 'No content available yet.')).toBe(true);
  });
});
