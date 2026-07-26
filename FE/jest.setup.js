import 'react-native-gesture-handler/jestSetup';

jest.mock('lucide-react-native', () => {
  return new Proxy({}, {
    get: function (target, prop) {
      if (prop === '__esModule') return true;
      return () => null;
    }
  });
});
jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn(() => 'unique-id'),
  getSystemVersion: jest.fn(() => '10.0'),
  getModel: jest.fn(() => 'Test Device'),
  isEmulator: jest.fn(() => Promise.resolve(false)),
  isEmulatorSync: jest.fn(() => false),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-orientation-locker', () => ({
  lockToPortrait: jest.fn(),
  lockToLandscape: jest.fn(),
  unlockAllOrientations: jest.fn(),
}));

jest.mock('react-native-blob-util', () => ({
  fs: {
    dirs: { DocumentDir: '', CacheDir: '' },
  },
  config: jest.fn(() => ({ fetch: jest.fn() })),
  fetch: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaConsumer: ({ children }: any) => children({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    SafeAreaView: ({ children, style, ...props }: any) => React.createElement(View, { style, ...props }, children),
  };
});


