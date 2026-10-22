const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Expo detects npm workspaces automatically (watchFolders + nodeModulesPaths).
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
