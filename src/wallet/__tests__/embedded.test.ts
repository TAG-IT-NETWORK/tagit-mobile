// expo-secure-store is a native module; stub it (tests use an in-memory store).
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 0,
}));

import {
  createEmbeddedWallet,
  loadEmbeddedWallet,
  loadOrCreateEmbeddedWallet,
  clearEmbeddedWallet,
  type KeyStore,
} from "../embedded";

function memStore(): KeyStore {
  const m = new Map<string, string>();
  return {
    get: async (k) => m.get(k) ?? null,
    set: async (k, v) => void m.set(k, v),
    del: async (k) => void m.delete(k),
  };
}

describe("embedded wallet", () => {
  it("returns null when no wallet exists", async () => {
    expect(await loadEmbeddedWallet(memStore())).toBeNull();
  });

  it("creates a wallet with a valid checksummed address and persists the key", async () => {
    const store = memStore();
    const w = await createEmbeddedWallet(store);
    expect(w.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(w.privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
    // Loading again returns the same address (persisted).
    const loaded = await loadEmbeddedWallet(store);
    expect(loaded?.address).toBe(w.address);
  });

  it("loadOrCreate is idempotent across calls", async () => {
    const store = memStore();
    const a = await loadOrCreateEmbeddedWallet(store);
    const b = await loadOrCreateEmbeddedWallet(store);
    expect(a.address).toBe(b.address);
  });

  it("clear removes the wallet", async () => {
    const store = memStore();
    await createEmbeddedWallet(store);
    await clearEmbeddedWallet(store);
    expect(await loadEmbeddedWallet(store)).toBeNull();
  });

  it("generates distinct keys each create", async () => {
    const w1 = await createEmbeddedWallet(memStore());
    const w2 = await createEmbeddedWallet(memStore());
    expect(w1.privateKey).not.toBe(w2.privateKey);
  });
});
