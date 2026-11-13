/**
 * Runtime config from environment.
 * For Expo, env vars are baked in at build time via the eas.json profile `env`
 * block (NOT .env — EAS does not read it) or .env for local `expo start`.
 * The fallback is the live HTTPS backend so a misconfigured build fails loudly
 * over HTTPS rather than silently hitting an iOS-ATS-blocked cleartext host.
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://api.tagit.network";
/**
 * Legacy general key (EXPO_PUBLIC_API_KEY). Since tagit-services #103 every
 * route the app calls accepts the app-tier key below, so public builds must
 * leave this EMPTY — an admin-tier value here is extractable from the bundle.
 * Kept only as a fallback for local dev builds against a test server.
 */
export const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? "";
/**
 * App-tier key for the consumer-app surface of tagit-services: POST
 * /api/v1/ask, POST /api/v1/verify and /api/v1/wallet/email/*. Injected at
 * build time from the EAS environment (EXPO_PUBLIC_ASK_KEY) — never committed.
 * Low privilege by design: it unlocks nothing else on the server.
 */
export const ASK_KEY = process.env.EXPO_PUBLIC_ASK_KEY ?? "";

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
