import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import VideoPlayerScreen from '../../../src/screens/player/VideoPlayerScreen.player';
import { Text, TouchableOpacity } from 'react-native';

const mockNavigation = { goBack: jest.fn() };
const mockRoute = { params: { fileUrl: 'https://secure-bunnycdn.com/video123.mp4', title: 'Test Video' } };

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
}));

jest.mock('react-native-orientation-locker', () => ({
  lockToPortrait: jest.fn(),
  lockToLandscapeLeft: jest.fn(),
}));

jest.mock('react-native-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  return React.forwardRef((props: any, ref: any) => {
    return <View testID="Video" {...props} />;
  });
});

describe('VideoPlayerScreen', () => {
  it('renders correctly and plays video', async () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<VideoPlayerScreen />);
    });
    
    const texts = root!.root.findAllByType(Text);
    expect(texts.some(t => t.props.children === 'Test Video')).toBe(true);

    const VideoComponent = root!.root.findByProps({ testID: 'Video' });
    expect(VideoComponent).toBeTruthy();
    expect(VideoComponent.props.source.uri).toBe('https://secure-bunnycdn.com/video123.mp4');

    // Simulate error
    await ReactTestRenderer.act(async () => {
      VideoComponent.props.onError({ error: 'Network dropped' });
    });

    const errorTexts = root!.root.findAllByType(Text);
    expect(errorTexts.some(t => t.props.children === 'Error loading video')).toBe(true);

    await ReactTestRenderer.act(async () => {
      root!.unmount();
    });
  });
});
