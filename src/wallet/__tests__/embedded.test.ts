// expo-secure-store is a native module; stub it (tests use an in-memory store).
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  canUseBiometricAuthentication: jest.fn(() => false),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 0,
}));

import { privateKeyToAccount } from "viem/accounts";
import {
  createEmbeddedWallet,
  loadEmbeddedWallet,
  loadOrCreateEmbeddedWallet,
  clearEmbeddedWallet,
  getSigningKey,
  WalletExistsError,
  NoWalletError,
  KeyInvalidatedError,
  type KeyStore,
} from "../embedded";

const KEY_NAME = "tagit.embedded.pk";
const ADDR_NAME = "tagit.embedded.address";
const LEGACY_PK = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

function memStore(opts: { supportsAuth?: boolean } = {}): KeyStore & {
  map: Map<string, string>;
  authGated: Set<string>;
  delOrder: string[];
  setCalls: Array<{ key: string; requireAuth: boolean }>;
} {
  const map = new Map<string, string>();
  const authGated = new Set<string>();
  const delOrder: string[] = [];
  const setCalls: Array<{ key: string; requireAuth: boolean }> = [];
  return {
    map,
    authGated,
    delOrder,
    setCalls,
    get: async (k) => map.get(k) ?? null,
    set: async (k, v, o) => {
      setCalls.push({ key: k, requireAuth: !!o?.requireAuth });
      map.set(k, v);
      if (o?.requireAuth) authGated.add(k);
      else authGated.delete(k);
    },
    del: async (k) => {
      delOrder.push(k);
      map.delete(k);
      authGated.delete(k);
    },
    supportsAuth: () => opts.supportsAuth ?? false,
  };
}

describe("embedded wallet", () => {
  it("returns null when no wallet exists", async () => {
    expect(await loadEmbeddedWallet(memStore())).toBeNull();
  });

  it("creates a wallet with a valid checksummed address and persists key + address", async () => {
    const store = memStore();
    const w = await createEmbeddedWallet(store);
    expect(w.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    // Public result carries NO key material.
    expect(Object.keys(w)).toEqual(["address"]);
    expect(store.map.get(KEY_NAME)).toMatch(/^0x[0-9a-fA-F]{64}$/);
    expect(store.map.get(ADDR_NAME)).toBe(w.address);
    const loaded = await loadEmbeddedWallet(store);
    expect(loaded?.address).toBe(w.address);
  });

  it("REFUSES to overwrite an existing wallet (key-overwrite race fix)", async () => {
    const store = memStore();
    const first = await createEmbeddedWallet(store);
    await expect(createEmbeddedWallet(store)).rejects.toThrow(WalletExistsError);
    expect((await loadEmbeddedWallet(store))?.address).toBe(first.address);
  });

  it("refuses to overwrite a LEGACY wallet (key item only, no address item)", async () => {
    const store = memStore();
    store.map.set(KEY_NAME, LEGACY_PK);
    await expect(createEmbeddedWallet(store)).rejects.toThrow(WalletExistsError);
    expect(store.map.get(KEY_NAME)).toBe(LEGACY_PK);
  });

  it("legacy layout: load derives + persists the address and leaves the key item untouched", async () => {
    const store = memStore({ supportsAuth: true });
    store.map.set(KEY_NAME, LEGACY_PK);
    const w = await loadEmbeddedWallet(store);
    expect(w?.address).toBe(privateKeyToAccount(LEGACY_PK).address);
    expect(store.map.get(ADDR_NAME)).toBe(w?.address);
    // No silent launch-time re-gating: legacy keys stay as stored (ungated)
    // until the wallet is recreated — documented testnet-only degradation.
    expect(store.authGated.has(KEY_NAME)).toBe(false);
    expect(store.map.get(KEY_NAME)).toBe(LEGACY_PK);
  });

  it("legacy layout: a failing address write is non-fatal (no lockout)", async () => {
    const store = memStore();
    store.map.set(KEY_NAME, LEGACY_PK);
    store.set = async () => {
      throw new Error("keystore write failed");
    };
    const w = await loadEmbeddedWallet(store);
    expect(w?.address).toBe(privateKeyToAccount(LEGACY_PK).address);
  });

  it("auth-gates the key item when the device supports it — and never the address item", async () => {
    const store = memStore({ supportsAuth: true });
    await createEmbeddedWallet(store);
    expect(store.authGated.has(KEY_NAME)).toBe(true);
    expect(store.authGated.has(ADDR_NAME)).toBe(false);
    // Gated write carries an explanatory prompt (Android shows it at write time).
    const gatedCall = store.setCalls.find((c) => c.requireAuth);
    expect(gatedCall?.key).toBe(KEY_NAME);
  });

  it("falls back to ungated key storage when the device lacks biometrics", async () => {
    const store = memStore({ supportsAuth: false });
    await createEmbeddedWallet(store);
    expect(store.authGated.has(KEY_NAME)).toBe(false);
    expect(store.map.get(KEY_NAME)).toBeDefined();
  });

  it("falls back to ungated storage when the gated write fails (cancel / missing plist)", async () => {
    const store = memStore({ supportsAuth: true });
    const rawSet = store.set.bind(store);
    let failedOnce = false;
    store.set = async (k, v, o) => {
      if (o?.requireAuth && !failedOnce) {
        failedOnce = true;
        throw new Error("user cancelled the prompt");
      }
      return rawSet(k, v, o);
    };
    const w = await createEmbeddedWallet(store);
    expect(failedOnce).toBe(true);
    expect(store.map.get(KEY_NAME)).toBeDefined();
    expect(store.authGated.has(KEY_NAME)).toBe(false);
    expect(store.map.get(ADDR_NAME)).toBe(w.address);
  });

  it("loadOrCreate is idempotent across calls", async () => {
    const store = memStore();
    const a = await loadOrCreateEmbeddedWallet(store);
    const b = await loadOrCreateEmbeddedWallet(store);
    expect(a.address).toBe(b.address);
  });

  it("CONCURRENT loadOrCreate calls single-flight to one key (double-tap race)", async () => {
    const store = memStore();
    const [a, b, c] = await Promise.all([
      loadOrCreateEmbeddedWallet(store),
      loadOrCreateEmbeddedWallet(store),
      loadOrCreateEmbeddedWallet(store),
    ]);
    expect(a.address).toBe(b.address);
    expect(b.address).toBe(c.address);
    // Exactly one key was ever written, and it controls the stored address.
    const keyWrites = store.setCalls.filter((s) => s.key === KEY_NAME);
    expect(keyWrites).toHaveLength(1);
    expect(privateKeyToAccount(store.map.get(KEY_NAME) as `0x${string}`).address).toBe(
      store.map.get(ADDR_NAME),
    );
  });

  it("clear removes both items, address FIRST (no phantom address on partial failure)", async () => {
    const store = memStore();
    await createEmbeddedWallet(store);
    await clearEmbeddedWallet(store);
    expect(store.map.size).toBe(0);
    expect(store.delOrder).toEqual([ADDR_NAME, KEY_NAME]);
    expect(await loadEmbeddedWallet(store)).toBeNull();
  });

  it("generates distinct keys each create", async () => {
    const s1 = memStore();
    const s2 = memStore();
    await createEmbeddedWallet(s1);
    await createEmbeddedWallet(s2);
    expect(s1.map.get(KEY_NAME)).not.toBe(s2.map.get(KEY_NAME));
  });

  describe("getSigningKey (signer-only accessor)", () => {
    it("returns the stored key and matches the public address", async () => {
      const store = memStore();
      const w = await createEmbeddedWallet(store);
      const pk = await getSigningKey(store);
      expect(privateKeyToAccount(pk).address).toBe(w.address);
    });

    it("throws NoWalletError when no wallet exists", async () => {
      await expect(getSigningKey(memStore())).rejects.toThrow(NoWalletError);
    });

    it("throws KeyInvalidatedError when the address survives but the key reads null (biometric re-enrollment)", async () => {
      const store = memStore();
      const w = await createEmbeddedWallet(store);
      // OS-invalidated biometry-bound entries read as null, not as an error.
      store.map.delete(KEY_NAME);
      await expect(getSigningKey(store)).rejects.toThrow(KeyInvalidatedError);
      expect(store.map.get(ADDR_NAME)).toBe(w.address);
    });

    it("passes the auth prompt through to the keystore read", async () => {
      const store = memStore();
      await createEmbeddedWallet(store);
      const spy = jest.spyOn(store, "get");
      await getSigningKey(store, "Approve transfer of asset #7");
      expect(spy).toHaveBeenCalledWith(KEY_NAME, { authPrompt: "Approve transfer of asset #7" });
    });
  });
});
