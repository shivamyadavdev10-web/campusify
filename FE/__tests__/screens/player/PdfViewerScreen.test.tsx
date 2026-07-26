import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import PdfViewerScreen from '../../../src/screens/player/PdfViewerScreen.player';
import axiosClient from '../../../src/api/axiosClient.api';
import { Text } from 'react-native';

const mockNavigation = { goBack: jest.fn() };
const mockRoute = { params: { documentId: 'doc-123', title: 'Test PDF' } };

jest.mock('../../../src/api/axiosClient.api', () => ({
  get: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
}));

jest.mock('react-native-pdf', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: any) => <View testID="Pdf" {...props} />;
});

jest.mock('react-native-blob-util', () => ({
  fs: {
    dirs: { DocumentDir: '/mock/dir' },
    exists: jest.fn().mockResolvedValue(false),
    unlink: jest.fn(),
  },
  config: jest.fn().mockReturnValue({
    fetch: jest.fn().mockReturnValue({
      progress: jest.fn(),
    })
  })
}));

describe('PdfViewerScreen', () => {
  it('renders correctly and fetches secure pdf URL', async () => {
    (axiosClient.get as jest.Mock).mockResolvedValueOnce({
      data: { status: true, url: 'https://secure-bunnycdn.com/doc123.pdf' }
    });

    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<PdfViewerScreen route={mockRoute} navigation={mockNavigation} />);
    });
    
    const texts = root!.root.findAllByType(Text);
    expect(texts.some(t => t.props.children === 'Test PDF')).toBe(true);
    
    // Check if API was called to fetch secure document
    expect(axiosClient.get).toHaveBeenCalledWith('/curriculum/secure-doc/doc-123');

    // Re-render empty state to resolve async
    await ReactTestRenderer.act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    const PdfComponent = root!.root.findByProps({ testID: 'Pdf' });
    expect(PdfComponent).toBeTruthy();
    expect(PdfComponent.props.source.uri).toBe('https://secure-bunnycdn.com/doc123.pdf');
  });

  it('renders error state on fetch failure', async () => {
    (axiosClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<PdfViewerScreen route={mockRoute} navigation={mockNavigation} />);
    });

    await ReactTestRenderer.act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    const texts = root!.root.findAllByType(Text);
    expect(texts.some(t => t.props.children === 'Failed to load Document')).toBe(true);
  });
});
