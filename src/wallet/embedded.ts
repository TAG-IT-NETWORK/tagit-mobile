/**
 * Embedded (on-device) EOA wallet.
 *
 * Generates a secp256k1 private key with viem (seeded by the RN CSPRNG
 * polyfill) and stores it in the device Keychain/Keystore via expo-secure-store.
 * This EOA is the default newcomer wallet and becomes the OWNER of the ERC-4337
 * smart account in Phase 4 (createAccountWithOwner), so it is forward-compatible
 * — not throwaway.
 *
 * Custody model (SEC_TRANSFER_STRIDE.md v2, approved 2026-07-03):
 *  - New keys are stored under KEY_NAME with OS-enforced user authentication
 *    (Keychain access control / BiometricPrompt) whenever the device supports
 *    it, so retrieval — even by same-process code — triggers the OS prompt.
 *    Devices without enrolled biometrics (and pre-hardening legacy keys) hold
 *    the key ungated: an accepted, documented degradation on testnet.
 *  - The address lives under ADDR_NAME without an auth gate, so app launch and
 *    identity display never prompt for biometrics.
 *  - The public API is ADDRESS-ONLY. The raw key is reachable solely through
 *    getSigningKey(), which is import-fenced to src/wallet/ by CI (as is this
 *    whole module's expo-secure-store surface).
 *  - Gated writes happen only in user-initiated context (wallet creation), with
 *    an explanatory prompt — never silently at app launch. iOS gated writes
 *    require NSFaceIDUsageDescription in the BUILT binary (injected via the
 *    expo-secure-store `faceIDPermission` plugin option — native rebuild
 *    required; do not ship this JS over-the-air onto older binaries).
 *
 * The keystore is abstracted so the derivation logic can be unit-tested with an
 * in-memory store (expo-secure-store is a native module, unavailable in jest).
 */
import * as SecureStore from "expo-secure-store";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Hex, Address } from "viem";

const KEY_NAME = "tagit.embedded.pk";
const ADDR_NAME = "tagit.embedded.address";

export interface KeyStore {
  get(key: string, opts?: { authPrompt?: string }): Promise<string | null>;
  set(key: string, value: string, opts?: { requireAuth?: boolean; authPrompt?: string }): Promise<void>;
  del(key: string): Promise<void>;
  /** Whether set({requireAuth:true}) can bind retrieval to user authentication. */
  supportsAuth?(): boolean;
}

/**
 * Default keystore backed by the device Keychain/Keystore. Deliberately NOT
 * exported: exporting it would hand every module a path around getSigningKey's
 * import fence. Tests inject their own in-memory KeyStore.
 */
const secureKeyStore: KeyStore = {
  get: (k, opts) =>
    SecureStore.getItemAsync(
      k,
      opts?.authPrompt ? { authenticationPrompt: opts.authPrompt } : undefined,
    ),
  set: (k, v, opts) =>
    SecureStore.setItemAsync(k, v, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      ...(opts?.requireAuth ? { requireAuthentication: true } : {}),
      // Android shows the prompt at gated WRITE time too; without a message the
      // system sheet has a blank title.
      ...(opts?.authPrompt ? { authenticationPrompt: opts.authPrompt } : {}),
    }),
  del: (k) => SecureStore.deleteItemAsync(k),
  // Passcode-only / weak-biometric devices report false and fall back to
  // ungated storage; requireAuthentication would throw without enrolled
  // (class-3) biometrics.
  supportsAuth: () => SecureStore.canUseBiometricAuthentication(),
};

export interface EmbeddedWallet {
  address: Address;
}

export class WalletExistsError extends Error {
  constructor() {
    super("An embedded wallet already exists on this device");
    this.name = "WalletExistsError";
  }
}

export class NoWalletError extends Error {
  constructor() {
    super("No embedded wallet exists on this device");
    this.name = "NoWalletError";
  }
}

/**
 * The key item exists but reads as null/unreadable while the address survives —
 * the OS invalidated the key material (typical cause: Face ID / fingerprint
 * re-enrollment invalidates biometry-bound Keychain/Keystore entries on BOTH
 * platforms). The wallet address is cryptographically dead; the UI must stop
 * presenting it as able to receive or sign.
 */
export class KeyInvalidatedError extends Error {
  constructor() {
    super("The wallet key was invalidated by a device biometric change");
    this.name = "KeyInvalidatedError";
  }
}

async function walletExists(store: KeyStore): Promise<boolean> {
  // ADDR_NAME first: never auth-gated, so this check cannot prompt. A bare
  // KEY_NAME occurs on the legacy layout (ungated) or a crash between create's
  // two writes; reading it here can prompt only in that rare crash case.
  if (await store.get(ADDR_NAME)) return true;
  return (await store.get(KEY_NAME, { authPrompt: "Restore your TAG IT wallet" })) !== null;
}

/** Load the existing embedded wallet's address, or null if none was created. */
export async function loadEmbeddedWallet(
  store: KeyStore = secureKeyStore,
): Promise<EmbeddedWallet | null> {
  const addr = (await store.get(ADDR_NAME)) as Address | null;
  if (addr) return { address: addr };

  // Legacy layout (pre-hardening) or interrupted create: key present without an
  // address item. Derive and persist the address — best-effort, so a keystore
  // hiccup can never lock out a perfectly readable key. The key itself is left
  // exactly as stored (legacy keys stay ungated — dev/testnet population only;
  // fresh keys are gated from creation).
  const pk = (await store.get(KEY_NAME, { authPrompt: "Restore your TAG IT wallet" })) as
    | Hex
    | null;
  if (!pk) return null;
  const address = privateKeyToAccount(pk).address;
  try {
    await store.set(ADDR_NAME, address);
  } catch {
    // Retry on next launch; the key item remains the source of truth.
  }
  return { address };
}

/**
 * Create a new embedded wallet and persist its key.
 * Refuses to overwrite: creating over an existing wallet would irreversibly
 * destroy the old key (and any assets it owns).
 */
export async function createEmbeddedWallet(
  store: KeyStore = secureKeyStore,
): Promise<EmbeddedWallet> {
  if (await walletExists(store)) throw new WalletExistsError();
  const pk = generatePrivateKey();
  const address = privateKeyToAccount(pk).address;

  // Gate the key to user authentication where the device supports it; fall
  // back to ungated storage when the gated write is impossible (no enrolled
  // biometrics, missing Face ID plist on an old binary, or user cancel of the
  // Android write-time prompt).
  const wantAuth = store.supportsAuth?.() ?? false;
  if (wantAuth) {
    try {
      await store.set(KEY_NAME, pk, {
        requireAuth: true,
        authPrompt: "Secure your TAG IT wallet key on this device",
      });
    } catch {
      await store.set(KEY_NAME, pk);
    }
  } else {
    await store.set(KEY_NAME, pk);
  }
  await store.set(ADDR_NAME, address);

  // Read-back assertion: guards against interleaved writes leaving a stored
  // address that no retrievable key controls.
  if ((await store.get(ADDR_NAME)) !== address) {
    throw new Error("Keystore write verification failed");
  }
  return { address };
}

// Single-flight guard: concurrent loadOrCreate calls (double-tap on "Create my
// wallet" under JS-thread congestion) must never generate two keys and
// interleave their writes.
const inflight = new WeakMap<KeyStore, Promise<EmbeddedWallet>>();

/** Load the embedded wallet, creating one on first run. Never overwrites. */
export function loadOrCreateEmbeddedWallet(
  store: KeyStore = secureKeyStore,
): Promise<EmbeddedWallet> {
  const existing = inflight.get(store);
  if (existing) return existing;
  const p = (async () => {
    try {
      return (await loadEmbeddedWallet(store)) ?? (await createEmbeddedWallet(store));
    } finally {
      inflight.delete(store);
    }
  })();
  inflight.set(store, p);
  return p;
}

/**
 * Permanently remove the embedded wallet from the device.
 * ADDR is deleted first: if the second delete fails, the leftover is a bare
 * key item — which the legacy path resurrects safely — rather than a phantom
 * address with no key behind it.
 */
export async function clearEmbeddedWallet(store: KeyStore = secureKeyStore): Promise<void> {
  await store.del(ADDR_NAME);
  await store.del(KEY_NAME);
}

/**
 * SIGNING-ONLY key accessor. Retrieval triggers the OS authentication prompt
 * when the key is auth-gated (any device with enrolled biometrics at creation
 * time).
 *
 * CI import fence: this symbol (and expo-secure-store generally) must not be
 * referenced outside src/wallet/ — see "Custody import fence" in ci.yml.
 */
export async function getSigningKey(
  store: KeyStore = secureKeyStore,
  authPrompt = "Confirm to authorize this transaction",
): Promise<Hex> {
  const pk = (await store.get(KEY_NAME, { authPrompt })) as Hex | null;
  if (!pk) {
    // Distinguish "no wallet" from "wallet shown in the UI but its key was
    // invalidated" (e.g. biometric re-enrollment) — the two need opposite UX.
    if (await store.get(ADDR_NAME)) throw new KeyInvalidatedError();
    throw new NoWalletError();
  }
  return pk;
}
