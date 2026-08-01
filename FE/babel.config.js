module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // NativeWind v4: jsxImportSource goes inside babel-preset-expo only.
      // The separate "nativewind/babel" preset is deprecated in v4.
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      // react-native-worklets-core/plugin removed — not needed for Expo Go
      // and caused Metro to crash since it has no Babel plugin export.
      "react-native-reanimated/plugin",
    ],
  };
};
