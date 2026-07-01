/**
 * Client for the tagit-services asset endpoints (Phase 0 backend).
 *   GET /api/v1/assets?owner=&chainId=        → owned summaries
 *   GET /api/v1/assets/:tokenId?chainId=      → detail + provenance
 */
import { API_URL, API_KEY } from "../config/env";
import { BASE_SEPOLIA_CHAIN_ID } from "../onchain/addresses";
import type { AssetSummary, AssetDetail } from "../vault/types";

export class AssetsApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "AssetsApiError";
  }
}

function authHeaders(): Record<string, string> {
  return API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {};
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.message ?? body.error ?? message;
    } catch {
      /* ignore */
    }
    throw new AssetsApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

interface AssetsListResponse {
  chainId: number;
  owner: string;
  count: number;
  assets: AssetSummary[];
}

/** Fetch the assets owned by an address. */
export async function fetchOwnedAssets(
  owner: string,
  chainId: number = BASE_SEPOLIA_CHAIN_ID,
): Promise<AssetSummary[]> {
  const data = await getJson<AssetsListResponse>(
    `/api/v1/assets?owner=${owner}&chainId=${chainId}`,
  );
  return data.assets;
}

/** Fetch full detail + provenance for one asset. */
export async function fetchAssetDetail(
  tokenId: string,
  chainId: number = BASE_SEPOLIA_CHAIN_ID,
): Promise<AssetDetail> {
  return getJson<AssetDetail>(`/api/v1/assets/${tokenId}?chainId=${chainId}`);
}
