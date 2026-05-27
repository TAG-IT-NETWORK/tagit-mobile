/**
 * Jest config for tagit-mobile.
 *
 * v1 tests target pure logic (on-chain decoders, request builders, store
 * reducers) and run in a plain node environment with babel transforming our
 * TS/TSX via babel-preset-expo. This avoids the React Native jest setup, which
 * fails to load under pnpm's nested node_modules layout.
 *
 * Component / RN-rendering tests (jest-expo preset) can be added later as a
 * separate Jest "project" once needed.
 */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  transform: {
    "^.+\\.(t|j)sx?$": ["babel-jest", { presets: ["babel-preset-expo"] }],
  },
  // Transform the ESM web3 deps we import in unit tests; ignore everything else.
  transformIgnorePatterns: [
    "node_modules/(?!\\.pnpm/)(?!(viem|zustand|abitype|ox|@noble|@scure)/)",
  ],
};
