/**
 * Embedded (on-device) EOA wallet.
 *
 * Generates a secp256k1 private key with viem (seeded by the RN CSPRNG
 * polyfill) and stores it in the device Keychain/Keystore via expo-secure-store.
 * This EOA is the default newcomer wallet and becomes the OWNER of the ERC-4337
 * smart account in Phase 4 (createAccountWithOwner), so it is forward-compatible
 * — not throwaway.
 *
 * The keystore is abstracted so the derivation logic can be unit-tested with an
 * in-memory store (expo-secure-store is a native module, unavailable in jest).
 */
import * as SecureStore from "expo-secure-store";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Hex, Address } from "viem";

const KEY_NAME = "tagit.embedded.pk";

export interface KeyStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

/** Default keystore backed by the device secure enclave. */
export const secureKeyStore: KeyStore = {
  get: (k) => SecureStore.getItemAsync(k),
  set: (k, v) =>
    SecureStore.setItemAsync(k, v, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }),
  del: (k) => SecureStore.deleteItemAsync(k),
};

export interface EmbeddedWallet {
  address: Address;
  privateKey: Hex;
}

/** Load the existing embedded wallet, or null if none has been created. */
export async function loadEmbeddedWallet(
  store: KeyStore = secureKeyStore,
): Promise<EmbeddedWallet | null> {
  const pk = (await store.get(KEY_NAME)) as Hex | null;
  if (!pk) return null;
  const account = privateKeyToAccount(pk);
  return { address: account.address, privateKey: pk };
}

/** Create a new embedded wallet and persist its key. Overwrites any existing. */
export async function createEmbeddedWallet(
  store: KeyStore = secureKeyStore,
): Promise<EmbeddedWallet> {
  const pk = generatePrivateKey();
  const account = privateKeyToAccount(pk);
  await store.set(KEY_NAME, pk);
  return { address: account.address, privateKey: pk };
}

/** Load the embedded wallet, creating one on first run. */
export async function loadOrCreateEmbeddedWallet(
  store: KeyStore = secureKeyStore,
): Promise<EmbeddedWallet> {
  return (await loadEmbeddedWallet(store)) ?? (await createEmbeddedWallet(store));
}

/** Permanently remove the embedded wallet key from the device. */
export async function clearEmbeddedWallet(store: KeyStore = secureKeyStore): Promise<void> {
  await store.del(KEY_NAME);
}
