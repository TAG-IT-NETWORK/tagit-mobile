/**
 * Runtime config from environment.
 * For Expo, env vars are baked in at build time via app.json extra or .env.
 * Defaults work for Android emulator → local backend.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3100";
export const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? "";

/**
 * Web verifier base (verify.tagit.network). Real NTAG 424 DNA chips emit an
 * encrypted PICC the device can't decrypt, so the SUN tap is verified
 * server-side here (the server holds the SDM master key). Used for the
 * encrypted-PICC scan path; the plaintext/demo path still uses API_URL.
 */
export const VERIFIER_URL =
  process.env.EXPO_PUBLIC_VERIFIER_URL ?? "https://verify.tagit.network";

/**
 * Dev/demo only: when set, the Vault queries this address instead of the
 * connected wallet. A fresh embedded wallet owns nothing, so this lets you see
 * the Vault populated against a known Base Sepolia holder during development.
 * Leave unset in production builds.
 */
export const DEV_OWNER = process.env.EXPO_PUBLIC_DEV_OWNER ?? "";
