const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

// Define the root path of the project
const root = path.resolve(__dirname, '..');

// Metro configuration
module.exports = mergeConfig(getDefaultConfig(__dirname), {
  resolver: {
    extraNodeModules: {
      'react-native': path.resolve(__dirname, 'node_modules/react-native'),
    },
  },
  watchFolders: [
    path.resolve(__dirname, '..'), // Watch the directory where your library is located
  ],
});
