import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import PrimaryButton from '../src/components/common/PrimaryButton.common';
import { Text, TouchableOpacity } from 'react-native';

describe('PrimaryButton Component', () => {
  it('renders correctly with the given title', async () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<PrimaryButton title="Click Me" onPress={() => {}} />);
    });
    
    const texts = root!.root.findAllByType(Text);
    expect(texts.some(t => t.props.children === 'Click Me')).toBe(true);
  });

  it('calls onPress function when clicked', async () => {
    const onPressMock = jest.fn();
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(<PrimaryButton title="Submit" onPress={onPressMock} />);
    });
    
    const button = root!.root.findByType(TouchableOpacity);
    await ReactTestRenderer.act(async () => {
      button.props.onPress();
    });
    
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPressMock = jest.fn();
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(
        <PrimaryButton title="Submit" onPress={onPressMock} disabled={true} />
      );
    });
    
    const button = root!.root.findByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);
    
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator when loading is true', async () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(
        <PrimaryButton title="Loading Button" onPress={() => {}} loading={true} />
      );
    });
    
    const button = root!.root.findByType(TouchableOpacity);
    expect(button.props.accessibilityState?.busy).toBe(true);
    
    // Title should not be rendered when loading
    const texts = root!.root.findAllByType(Text);
    expect(texts.some(t => t.props.children === 'Loading Button')).toBe(false);
  });
});
