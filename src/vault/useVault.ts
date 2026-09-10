/**
 * Vault data hooks.
 *
 * META-T38: the owned-assets list is cache-first — useOwnedAssets renders
 * instantly from the persisted per-owner vault store (zustand + AsyncStorage)
 * and reconciles with a background conditional refetch (If-None-Match with
 * the stored weak ETag; 304 = cache kept). Refetch triggers: mount/owner
 * change, app foreground, and the screen's own focus/pull-to-refresh calls.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { AppState } from "react-native";
import { fetchAssetDetail } from "../services/assets";
import { useVaultStore, ownerKey } from "./store";
import type { AssetSummary, AssetDetail } from "./types";

const EMPTY_ASSETS: AssetSummary[] = [];

interface ListState {
  assets: AssetSummary[];
  /** Initial load only: a refetch is in flight and there is no cache yet. */
  loading: boolean;
  /** Any refetch in flight (drives pull-to-refresh spinners). */
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * The assets owned by `owner` — instantly from cache, refreshed in the
 * background. No-op (empty) when owner is null.
 */
export function useOwnedAssets(owner: string | null): ListState {
  const key = owner ? ownerKey(owner) : null;
  const assets = useVaultStore((s) => (key ? (s.byOwner[key]?.assets ?? EMPTY_ASSETS) : EMPTY_ASSETS));
  const hasCache = useVaultStore((s) => (key ? s.byOwner[key] !== undefined : false));
  const refreshing = useVaultStore((s) => (key ? (s.refreshing[key] ?? false) : false));
  const error = useVaultStore((s) => (key ? (s.errors[key] ?? null) : null));
  const storeRefresh = useVaultStore((s) => s.refresh);

  const refresh = useCallback(() => {
    if (owner) void storeRefresh(owner);
  }, [owner, storeRefresh]);

  // Background refetch on mount / owner change (cache renders meanwhile).
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refetch when the app returns to the foreground — the vault may have
  // changed while backgrounded (transfer landed, purchase settled).
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (next === "active" && prev !== "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return {
    assets,
    loading: refreshing && !hasCache,
    refreshing,
    error,
    refresh,
  };
}

interface DetailState {
  asset: AssetDetail | null;
  loading: boolean;
  error: string | null;
}

/** Load detail + provenance for one token. */
export function useAssetDetail(tokenId: string, refresh?: number): DetailState {
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // No token (e.g. Ask opened standalone) → nothing to load.
    if (!tokenId) {
      setLoading(false);
      setAsset(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAssetDetail(tokenId)
      .then((a) => {
        if (!cancelled) setAsset(a);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load asset");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tokenId, refresh]);

  return { asset, loading, error };
}
