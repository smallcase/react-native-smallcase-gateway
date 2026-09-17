const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const path = require('path');
const config = {
  watchFolders: [path.resolve(__dirname, '..')],
  resolver: {
    resolveRequest(context, moduleName, platform) {
      const packageName = 'react-native-smallcase-gateway';
      if (moduleName === packageName) {
        return context.resolveRequest(
          context,
          path.resolve(__dirname, '../src/index.js'),
          platform,
        );
      }
      if (moduleName.startsWith(`${packageName}/`)) {
        return context.resolveRequest(
          context,
          path.resolve(
            __dirname,
            '..',
            moduleName.slice(packageName.length + 1),
          ),
          platform,
        );
      }
      return context.resolveRequest(context, moduleName, platform);
    },
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
    extraNodeModules: {
      'react-native-smallcase-gateway': path.resolve(__dirname, '..'),
    },
    // Resolve dependencies shared with the wrapper from this sample installation.
    disableHierarchicalLookup: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
