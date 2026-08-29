/**
 * Vault list store (META-T38) — Zustand, persisted to AsyncStorage.
 *
 * Cache-first vault: the owned-assets list is persisted per owner address so
 * the Vault grid renders instantly on focus from the last known state, then a
 * background conditional refetch (If-None-Match with the stored weak ETag)
 * reconciles. A 304 is a no-op — the cache is already current.
 *
 * Keyed by lowercased owner address: switching wallets (embedded ↔ connected,
 * or DEV_OWNER demos) swaps to that owner's cache without cross-pollination.
 *
 * Only `byOwner` is persisted; per-owner refresh/error flags are transient.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchOwnedAssetsConditional } from "../services/assets";
import { BASE_SEPOLIA_CHAIN_ID } from "../onchain/addresses";
import type { AssetSummary } from "./types";

export interface OwnerVaultEntry {
  assets: AssetSummary[];
  /** Weak ETag of the last 200 response, sent back as If-None-Match. */
  etag?: string;
  /** Unix ms of the last successful fetch (200 or 304). */
  fetchedAt: number;
}

interface VaultState {
  /** Persisted cache, keyed by lowercased owner address. */
  byOwner: Record<string, OwnerVaultEntry>;
  /** Transient: owners with a refresh in flight (dedupes concurrent calls). */
  refreshing: Record<string, boolean>;
  /** Transient: last refresh error per owner (null once a refresh succeeds). */
  errors: Record<string, string | null>;

  /** Cached list for an owner — instant, no fetch. Empty when never fetched. */
  getCached: (owner: string) => AssetSummary[];
  /** True when this owner has a cache entry (even an empty vault). */
  hasCache: (owner: string) => boolean;
  /**
   * Conditional refetch for one owner. Sends the stored ETag as If-None-Match;
   * 304 keeps the cache (only fetchedAt moves), 200 replaces it. Errors are
   * recorded per owner and never clear the cache.
   */
  refresh: (owner: string, chainId?: number) => Promise<void>;
  /** Drop one owner's cache (e.g. wallet forgotten). */
  clearOwner: (owner: string) => void;
  /** Drop the whole cache. */
  clear: () => void;
}

export function ownerKey(owner: string): string {
  return owner.toLowerCase();
}

/** The persisted subset of VaultState (see partialize below). */
interface PersistedVaultState {
  byOwner: Record<string, OwnerVaultEntry>;
}

/** Shallow shape check for a persisted payload we are willing to hydrate. */
function isPersistedVaultState(value: unknown): value is PersistedVaultState {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as PersistedVaultState).byOwner === "object" &&
    (value as PersistedVaultState).byOwner !== null
  );
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      byOwner: {},
      refreshing: {},
      errors: {},

      getCached: (owner) => get().byOwner[ownerKey(owner)]?.assets ?? [],

      hasCache: (owner) => get().byOwner[ownerKey(owner)] !== undefined,

      refresh: async (owner, chainId = BASE_SEPOLIA_CHAIN_ID) => {
        const key = ownerKey(owner);
        if (get().refreshing[key]) return;
        set((s) => ({ refreshing: { ...s.refreshing, [key]: true } }));
        try {
          const cached = get().byOwner[key];
          const result = await fetchOwnedAssetsConditional(owner, chainId, cached?.etag);
          if (result.status === 304) {
            // Cache still fresh — keep assets + etag, just note the check.
            set((s) => {
              const entry = s.byOwner[key];
              if (!entry) return s; // cache cleared mid-flight — nothing to touch
              return {
                byOwner: { ...s.byOwner, [key]: { ...entry, fetchedAt: Date.now() } },
                errors: { ...s.errors, [key]: null },
              };
            });
          } else {
            set((s) => ({
              byOwner: {
                ...s.byOwner,
                [key]: { assets: result.data, etag: result.etag, fetchedAt: Date.now() },
              },
              errors: { ...s.errors, [key]: null },
            }));
          }
        } catch (e) {
          set((s) => ({
            errors: {
              ...s.errors,
              [key]: e instanceof Error ? e.message : "Failed to load assets",
            },
          }));
        } finally {
          set((s) => ({ refreshing: { ...s.refreshing, [key]: false } }));
        }
      },

      clearOwner: (owner) =>
        set((s) => {
          const key = ownerKey(owner);
          const byOwner = { ...s.byOwner };
          delete byOwner[key];
          return { byOwner };
        }),

      clear: () => set({ byOwner: {}, errors: {} }),
    }),
    {
      name: "tagit-vault",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // Persist only the cache; in-flight/error flags are session-local.
      partialize: (s) => ({ byOwner: s.byOwner }),
      /**
       * Runs only on a version mismatch. v0 is the pre-versioning payload
       * (identical shape) — keep it. Anything else (corrupt, or written by a
       * newer build) drops to the safe empty shape: this is a refetchable
       * cache, so an empty vault cache is always correct, just cold.
       */
      migrate: (persisted, version) => {
        if (version === 0 && isPersistedVaultState(persisted)) return persisted;
        return { byOwner: {} };
      },
      /**
       * Hydration reconcile — closes the hydrate-after-fetch race. AsyncStorage
       * rehydration is async, so a conditional refetch can land BEFORE the
       * persisted (stale) cache hydrates; per owner, whichever entry has the
       * newer fetchedAt wins, so a resolved fetch is never clobbered by the
       * disk cache. Transient flags always come from the live state.
       */
      merge: (persisted, current) => {
        const disk = isPersistedVaultState(persisted) ? persisted.byOwner : {};
        const byOwner: Record<string, OwnerVaultEntry> = { ...disk };
        for (const [key, entry] of Object.entries(current.byOwner)) {
          const hydrated = byOwner[key];
          if (!hydrated || hydrated.fetchedAt <= entry.fetchedAt) byOwner[key] = entry;
        }
        return { ...current, byOwner };
      },
    },
  ),
);
