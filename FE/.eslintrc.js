module.exports = {
  root: true,
  extends: '@react-native',
  parserOptions: {
    requireConfigFile: false, // 👈 Yeh line error ko theek karegi
    babelOptions: {
      presets: ['@react-native/babel-preset'],
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off', // 👈 React 17+ ke liye zaroori
  },
};