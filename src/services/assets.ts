/**
 * Client for the tagit-services asset endpoints (Phase 0 backend).
 *   GET /api/v1/assets?owner=&chainId=        → owned summaries
 *   GET /api/v1/assets/:tokenId?chainId=      → detail + provenance
 *
 * META-T38: conditional-request variants. The detail endpoint sends a weak
 * ETag and honors If-None-Match with 304; the same machinery is applied to the
 * list fetch — if the server has no ETag for a route yet, the etag simply
 * stays undefined and the request is unconditional.
 */
import { API_URL, API_KEY } from "../config/env";
import { BASE_SEPOLIA_CHAIN_ID } from "../onchain/addresses";
import { mapAssetDetail, mapAssetSummary } from "../vault/mapAsset";
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

async function toApiError(res: Response): Promise<AssetsApiError> {
  let message = `HTTP ${res.status}`;
  try {
    const body = await res.json();
    message = body.message ?? body.error ?? message;
  } catch {
    /* ignore */
  }
  return new AssetsApiError(message, res.status);
}

/**
 * Result of a conditional GET: 304 means "cache still fresh — keep what you
 * have" (no body); 200 carries the fresh body + the response ETag (weak,
 * stored verbatim for the next If-None-Match).
 */
export type ConditionalResult<T> =
  | { status: 304 }
  | { status: 200; data: T; etag?: string };

async function getJsonConditional<T>(
  path: string,
  etag?: string,
): Promise<ConditionalResult<T>> {
  const headers: Record<string, string> = {
    ...authHeaders(),
    ...(etag ? { "If-None-Match": etag } : {}),
  };
  const res = await fetch(`${API_URL}${path}`, { headers });
  if (res.status === 304) return { status: 304 };
  if (!res.ok) throw await toApiError(res);
  const data = (await res.json()) as T;
  return { status: 200, data, etag: res.headers.get("etag") ?? undefined };
}

async function getJson<T>(path: string): Promise<T> {
  const result = await getJsonConditional<T>(path);
  // Unconditional request (no If-None-Match sent) — a 304 cannot occur.
  if (result.status !== 200) {
    throw new AssetsApiError("Unexpected 304 for unconditional request", 304);
  }
  return result.data;
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
  return data.assets.map(mapAssetSummary);
}

/**
 * Conditionally fetch the owned-assets list with a previously stored ETag.
 * 304 → the caller keeps its cache untouched.
 */
export async function fetchOwnedAssetsConditional(
  owner: string,
  chainId: number = BASE_SEPOLIA_CHAIN_ID,
  etag?: string,
): Promise<ConditionalResult<AssetSummary[]>> {
  const result = await getJsonConditional<AssetsListResponse>(
    `/api/v1/assets?owner=${owner}&chainId=${chainId}`,
    etag,
  );
  if (result.status === 304) return result;
  return {
    status: 200,
    data: result.data.assets.map(mapAssetSummary),
    etag: result.etag,
  };
}

/** Fetch full detail + provenance for one asset. */
export async function fetchAssetDetail(
  tokenId: string,
  chainId: number = BASE_SEPOLIA_CHAIN_ID,
): Promise<AssetDetail> {
  const raw = await getJson<AssetDetail>(`/api/v1/assets/${tokenId}?chainId=${chainId}`);
  return mapAssetDetail(raw);
}

/**
 * Conditionally fetch asset detail with a previously stored (weak) ETag.
 * The detail endpoint honors If-None-Match; 304 → keep the cached detail.
 */
export async function fetchAssetDetailConditional(
  tokenId: string,
  chainId: number = BASE_SEPOLIA_CHAIN_ID,
  etag?: string,
): Promise<ConditionalResult<AssetDetail>> {
  const result = await getJsonConditional<AssetDetail>(
    `/api/v1/assets/${tokenId}?chainId=${chainId}`,
    etag,
  );
  if (result.status === 304) return result;
  return { status: 200, data: mapAssetDetail(result.data), etag: result.etag };
}
