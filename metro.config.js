// Minimal Metro config — extends Expo's default. Previously we customized this
// to handle pnpm's workspace symlinks, but .npmrc `node-linker=hoisted` now
// produces a flat node_modules, so no overrides are needed.
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
