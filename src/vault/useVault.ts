/**
 * Vault data hooks — thin async state machines over services/assets.
 */
import { useState, useEffect, useCallback } from "react";
import { fetchOwnedAssets, fetchAssetDetail } from "../services/assets";
import type { AssetSummary, AssetDetail } from "./types";

interface ListState {
  assets: AssetSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/** Load the assets owned by `owner`. No-op (empty) when owner is null. */
export function useOwnedAssets(owner: string | null): ListState {
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!owner) {
      setAssets([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setAssets(await fetchOwnedAssets(owner));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, [owner]);

  useEffect(() => {
    void load();
  }, [load]);

  return { assets, loading, error, refresh: load };
}

interface DetailState {
  asset: AssetDetail | null;
  loading: boolean;
  error: string | null;
}

/** Load detail + provenance for one token. */
export function useAssetDetail(tokenId: string): DetailState {
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
  }, [tokenId]);

  return { asset, loading, error };
}
