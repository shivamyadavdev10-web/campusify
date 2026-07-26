module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-native-community|@react-navigation|react-native-device-info)'
  ],
  moduleNameMapper: {
    '^test-renderer$': 'react-test-renderer'
  }
};
