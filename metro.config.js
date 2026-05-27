// Metro config for a pnpm monorepo (Expo SDK 52).
// Lets Metro resolve hoisted/symlinked deps from the workspace root, not just
// the app's own node_modules — required because pnpm doesn't flatten deps.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Watch the whole workspace so changes in linked packages are picked up.
config.watchFolders = [workspaceRoot];

// Resolve modules from the app first, then the workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Keep hierarchical lookup so deeply-nested pnpm symlinks still resolve.
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
