/**
 * Crypto / encoding polyfills required by viem & wallet libs on React Native.
 *
 * MUST be imported once, before any code that touches viem/wagmi/permissionless.
 * Import this at the very top of the app entry (index/App.tsx):
 *
 *   import "./src/onchain/polyfills";
 *
 * - react-native-get-random-values  → crypto.getRandomValues (key generation)
 * - fast-text-encoding              → TextEncoder / TextDecoder (ABI encoding)
 *
 * Hermes lacks both by default; without them viem throws opaque errors deep in
 * encoding/signing paths that are very hard to trace. Keep this import first.
 */
import "react-native-get-random-values";
import "fast-text-encoding";

export {};
