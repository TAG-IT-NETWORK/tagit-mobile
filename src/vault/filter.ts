/**
 * Pure client-side search/filter over the owned-assets list. The backend has
 * no search/filter query params and a vault holds tens of assets at most, so
 * filtering happens on-device against the already-fetched list.
 */
import { LIFECYCLE_STATES, type LifecycleState } from "../config/constants";
import type { AssetSummary } from "./types";

export type StateFilter = LifecycleState | "ALL";

/** NFC-normalize + lowercase so decomposed metadata matches keyboard input. */
function norm(s: string): string {
  return s.normalize("NFC").toLowerCase();
}

/**
 * Case-insensitive match on the title the card actually displays (name, or
 * the "Asset #id" fallback for unnamed assets) or the token id. A leading "#"
 * targets the token id only ("#43"); a bare query matches either ("43",
 * "rolex").
 */
export function matchesQuery(asset: AssetSummary, query: string): boolean {
  const q = norm(query.trim());
  if (!q) return true;
  if (q.startsWith("#")) {
    const idQuery = q.slice(1);
    return idQuery.length > 0 && asset.tokenId.toLowerCase().includes(idQuery);
  }
  if (asset.tokenId.toLowerCase().includes(q)) return true;
  // Same fallback AssetCard renders — users search what they see.
  return norm(asset.name ?? `Asset #${asset.tokenId}`).includes(q);
}

/** True when the asset's lifecycle state passes the chip filter. */
export function matchesState(asset: AssetSummary, filter: StateFilter): boolean {
  return filter === "ALL" || asset.lifecycleState === filter;
}

/** Apply both the free-text query and the state chip to the asset list. */
export function filterAssets(
  assets: AssetSummary[],
  query: string,
  state: StateFilter,
): AssetSummary[] {
  return assets.filter((a) => matchesState(a, state) && matchesQuery(a, query));
}

/**
 * Distinct lifecycle states present in the list, in canonical lifecycle order
 * — drives the filter chips so only states the user actually holds appear.
 */
export function availableStates(assets: AssetSummary[]): LifecycleState[] {
  const present = new Set(assets.map((a) => a.lifecycleState));
  return LIFECYCLE_STATES.filter((s) => present.has(s));
}
