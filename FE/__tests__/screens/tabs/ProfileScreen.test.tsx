import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import ProfileScreen from '../../../src/screens/tabs/ProfileScreen.tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axiosClient from '../../../src/api/axiosClient.api';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { Text, Alert, TouchableOpacity } from 'react-native';

jest.mock('../../../src/api/axiosClient.api', () => ({
  get: jest.fn(),
  post: jest.fn(),
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

jest.spyOn(Alert, 'alert');

describe('ProfileScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await ReactTestRenderer.act(async () => {
      useAuthStore.setState({ 
        userProfile: { 
          firstName: 'Jane', 
          lastName: 'Doe',
          email: 'jane@example.com',
          myCourses: [
            { _id: 'c1', title: 'Fullstack Course' }
          ]
        }
      });
    });
    queryClient.clear();
  });

  it('renders user profile data (name/avatar/email)', async () => {

    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <ProfileScreen navigation={mockNavigation} />
        </QueryClientProvider>
      );
    });

    const allTexts = root!.root.findAllByType(Text);
    
    const getText = (node: any) => Array.isArray(node.props.children) ? node.props.children.join('') : node.props.children;
    
    // Test: Name is displayed
    expect(allTexts.some(node => getText(node) === 'Jane Doe')).toBe(true);
    // Test: Email is displayed
    expect(allTexts.some(node => getText(node) === 'jane@example.com')).toBe(true);
    // Test: Avatar (Initials JD) is displayed
    expect(allTexts.some(node => getText(node) === 'JD')).toBe(true);
    // Test: My courses are shown
    expect(allTexts.some(node => getText(node) === 'Fullstack Course')).toBe(true);
    await ReactTestRenderer.act(async () => {
      root!.unmount();
    });
  });

  it('renders payment history when payments tab is selected', async () => {
    (axiosClient.get as jest.Mock).mockResolvedValue({ 
      data: { status: true, payments: [{ _id: 'pay123', amount: 500, status: 'Success', createdAt: '2026-07-19T00:00:00Z', semesterId: { title: 'Test Combo' } }] } 
    });

    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      root = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <ProfileScreen navigation={mockNavigation} />
        </QueryClientProvider>
      );
    });

    const allTexts = root!.root.findAllByType(Text);
    const getText = (node: any) => Array.isArray(node.props.children) ? node.props.children.join('') : node.props.children;
    
    // Find Payments tab
    const paymentsTab = root!.root.findAllByType(TouchableOpacity as any).find(btn => {
      const texts = btn.findAllByType(Text);
      return texts.some(t => t.props.children === 'PAYMENTS');
    });

    await ReactTestRenderer.act(async () => {
      paymentsTab!.props.onPress();
    });

    // Wait for the react-query fetch and flatlist to render
    await ReactTestRenderer.act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    const newTexts = root!.root.findAllByType(Text);
    console.log("TEXTS FOUND:", newTexts.map(node => getText(node)));
    expect(newTexts.some(node => getText(node) === 'Test Combo')).toBe(true);
    expect(newTexts.some(node => getText(node) === '₹500')).toBe(true);
    expect(newTexts.some(node => getText(node) === 'Success')).toBe(true);
    await ReactTestRenderer.act(async () => {
      root!.unmount();
    });
  });
});
