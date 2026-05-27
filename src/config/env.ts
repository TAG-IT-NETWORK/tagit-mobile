/**
 * Runtime config from environment.
 * For Expo, env vars are baked in at build time via app.json extra or .env.
 * Defaults work for Android emulator → local backend.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3100";
export const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? "";

/**
 * Dev/demo only: when set, the Vault queries this address instead of the
 * connected wallet. A fresh embedded wallet owns nothing, so this lets you see
 * the Vault populated against a known Base Sepolia holder during development.
 * Leave unset in production builds.
 */
export const DEV_OWNER = process.env.EXPO_PUBLIC_DEV_OWNER ?? "";
