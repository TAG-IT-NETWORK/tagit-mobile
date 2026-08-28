/**
 * Vault store tests: persisted cache hydration, conditional refetch with
 * If-None-Match, and the 304 no-op path (META-T38).
 *
 * AsyncStorage is replaced with an in-memory mock (node test env has no RN
 * native module); fetch is mocked per test.
 */
import type { AssetSummary } from "../types";

// In-memory AsyncStorage — the factory must be self-contained (jest.mock hoist).
jest.mock("@react-native-async-storage/async-storage", () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => store[k] ?? null),
      setItem: jest.fn(async (k: string, v: string) => {
        store[k] = v;
      }),
      removeItem: jest.fn(async (k: string) => {
        delete store[k];
      }),
      clear: jest.fn(async () => {
        store = {};
      }),
    },
  };
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useVaultStore, ownerKey } from "../store";

const OWNER = "0xAbCd000000000000000000000000000000001234";
const KEY = ownerKey(OWNER);

const ASSET: AssetSummary = {
  tokenId: "43",
  owner: OWNER,
  stateCode: 4,
  lifecycleState: "CLAIMED",
  name: "Rolex Submariner",
  timestamp: 1700000000,
  thumb: `https://media.tagit.network/i/${"a".repeat(64)}/sm.webp`,
  blurhash: "LKO2?U%2Tw=w",
};

type FetchMock = jest.Mock<Promise<unknown>, [string, RequestInit?]>;

function mockFetch(): FetchMock {
  const fn = jest.fn();
  (global as { fetch: unknown }).fetch = fn;
  return fn as FetchMock;
}

function jsonResponse(body: unknown, etag?: string) {
  return {
    ok: true,
    status: 200,
    headers: { get: (name: string) => (name.toLowerCase() === "etag" ? (etag ?? null) : null) },
    json: async () => body,
  };
}

function notModifiedResponse(etag: string) {
  return {
    ok: false,
    status: 304,
    headers: { get: (name: string) => (name.toLowerCase() === "etag" ? etag : null) },
    json: async () => {
      throw new Error("304 has no body");
    },
  };
}

const LIST_BODY = { chainId: 84532, owner: OWNER, count: 1, assets: [ASSET] };
const WEAK_ETAG = 'W/"43:3:3:confirmed:0xAbCd:1700"';

beforeEach(() => {
  useVaultStore.setState({ byOwner: {}, refreshing: {}, errors: {} });
  jest.clearAllMocks();
});

describe("refresh", () => {
  it("stores assets + weak ETag from a 200 response", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse(LIST_BODY, WEAK_ETAG));

    await useVaultStore.getState().refresh(OWNER);

    const entry = useVaultStore.getState().byOwner[KEY];
    expect(entry.assets).toEqual([ASSET]);
    expect(entry.etag).toBe(WEAK_ETAG);
    expect(entry.fetchedAt).toBeGreaterThan(0);
    expect(useVaultStore.getState().errors[KEY]).toBeNull();
    // First fetch is unconditional — no If-None-Match header.
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers["If-None-Match"]).toBeUndefined();
  });

  it("sends If-None-Match with the stored ETag and treats 304 as a no-op", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse(LIST_BODY, WEAK_ETAG));
    await useVaultStore.getState().refresh(OWNER);
    const before = useVaultStore.getState().byOwner[KEY];

    fetchMock.mockResolvedValueOnce(notModifiedResponse(WEAK_ETAG));
    await useVaultStore.getState().refresh(OWNER);

    const headers = (fetchMock.mock.calls[1][1] as RequestInit).headers as Record<string, string>;
    expect(headers["If-None-Match"]).toBe(WEAK_ETAG);

    const after = useVaultStore.getState().byOwner[KEY];
    // 304 = cache kept: same assets (same reference — untouched), same etag.
    expect(after.assets).toBe(before.assets);
    expect(after.etag).toBe(WEAK_ETAG);
    expect(after.fetchedAt).toBeGreaterThanOrEqual(before.fetchedAt);
  });

  it("replaces the cache when the ETag changed (200 after 304 cycle)", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse(LIST_BODY, WEAK_ETAG));
    await useVaultStore.getState().refresh(OWNER);

    const updated = { ...LIST_BODY, assets: [{ ...ASSET, stateCode: 5, lifecycleState: "FLAGGED" }] };
    fetchMock.mockResolvedValueOnce(jsonResponse(updated, 'W/"next"'));
    await useVaultStore.getState().refresh(OWNER);

    const entry = useVaultStore.getState().byOwner[KEY];
    expect(entry.assets[0].lifecycleState).toBe("FLAGGED");
    expect(entry.etag).toBe('W/"next"');
  });

  it("works against servers that send no ETag (etag stays undefined)", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse(LIST_BODY));

    await useVaultStore.getState().refresh(OWNER);
    expect(useVaultStore.getState().byOwner[KEY].etag).toBeUndefined();

    await useVaultStore.getState().refresh(OWNER);
    const headers = (fetchMock.mock.calls[1][1] as RequestInit).headers as Record<string, string>;
    expect(headers["If-None-Match"]).toBeUndefined();
  });

  it("keeps the cache and records the error on a failed refetch", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse(LIST_BODY, WEAK_ETAG));
    await useVaultStore.getState().refresh(OWNER);

    fetchMock.mockRejectedValueOnce(new Error("Network request failed"));
    await useVaultStore.getState().refresh(OWNER);

    expect(useVaultStore.getState().byOwner[KEY].assets).toEqual([ASSET]);
    expect(useVaultStore.getState().errors[KEY]).toBe("Network request failed");
    expect(useVaultStore.getState().refreshing[KEY]).toBe(false);
  });

  it("keys the cache by lowercased owner (mixed-case queries hit one entry)", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse(LIST_BODY, WEAK_ETAG));
    await useVaultStore.getState().refresh(OWNER.toUpperCase().replace("0X", "0x"));

    expect(useVaultStore.getState().getCached(OWNER.toLowerCase())).toEqual([ASSET]);
    expect(useVaultStore.getState().hasCache(OWNER)).toBe(true);
  });
});

describe("cache hydration", () => {
  it("rehydrates the persisted per-owner cache from AsyncStorage", async () => {
    const persisted = {
      state: {
        byOwner: {
          [KEY]: { assets: [ASSET], etag: WEAK_ETAG, fetchedAt: 1700000001000 },
        },
      },
      version: 0,
    };
    await AsyncStorage.setItem("tagit-vault", JSON.stringify(persisted));

    await useVaultStore.persist.rehydrate();

    const entry = useVaultStore.getState().byOwner[KEY];
    expect(entry.assets).toEqual([ASSET]);
    expect(entry.etag).toBe(WEAK_ETAG);
    // Hydrated summaries keep the additive thumb/blurhash fields.
    expect(entry.assets[0].thumb).toBe(ASSET.thumb);
    expect(entry.assets[0].blurhash).toBe(ASSET.blurhash);
    // Instant render path: cached list is available without any fetch.
    expect(useVaultStore.getState().getCached(OWNER)).toEqual([ASSET]);
  });

  it("persists the cache (byOwner only) after a successful refresh", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse(LIST_BODY, WEAK_ETAG));
    await useVaultStore.getState().refresh(OWNER);
    // zustand persist writes asynchronously — flush microtasks.
    await new Promise((r) => setTimeout(r, 0));

    const raw = await AsyncStorage.getItem("tagit-vault");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.byOwner[KEY].assets).toEqual([ASSET]);
    expect(parsed.state.byOwner[KEY].etag).toBe(WEAK_ETAG);
    // Transient flags never persist.
    expect(parsed.state.refreshing).toBeUndefined();
    expect(parsed.state.errors).toBeUndefined();
  });
});

describe("clearOwner / clear", () => {
  it("drops a single owner's cache", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse(LIST_BODY, WEAK_ETAG));
    await useVaultStore.getState().refresh(OWNER);

    useVaultStore.getState().clearOwner(OWNER);
    expect(useVaultStore.getState().hasCache(OWNER)).toBe(false);
    expect(useVaultStore.getState().getCached(OWNER)).toEqual([]);
  });
});
