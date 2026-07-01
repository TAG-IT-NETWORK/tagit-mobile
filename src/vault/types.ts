/**
 * Asset DTOs shared between the app and the tagit-services /api/v1/assets
 * endpoint. Keep this in sync with the server response shape.
 */
import type { LifecycleState } from "../config/constants";

/** One owned asset as shown in the Vault list (cheap to fetch). */
export interface AssetSummary {
  tokenId: string;
  owner: string;
  /** Numeric lifecycle state (0..6) from TAGITCore.getAsset. */
  stateCode: number;
  /** Mapped name, e.g. "ACTIVATED". "UNKNOWN" if out of range. */
  lifecycleState: LifecycleState | "UNKNOWN";
  /** Display name resolved from tokenURI metadata, if available. */
  name?: string;
  /** Resolved image URL (ipfs:// already gateway-rewritten server-side). */
  image?: string;
  /** Unix seconds of the asset's last state change. */
  timestamp: number;
}

/** A single provenance/history entry reconstructed from on-chain events. */
export interface ProvenanceEvent {
  /** Event kind: "AssetMinted" | "TagBound" | "StateChanged" | "Transfer". */
  type: string;
  /** Human label, e.g. "Activated" or "Transferred to 0x12…ab". */
  label: string;
  blockNumber: number;
  txHash: string;
  /** Unix seconds, when resolvable from the block. */
  timestamp?: number;
  /** Raw decoded args for advanced display. */
  data?: Record<string, unknown>;
}

/** Full asset detail incl. metadata + provenance timeline. */
export interface AssetDetail extends AssetSummary {
  description?: string;
  tokenURI?: string;
  /** Tag hash bound to this token (bytes32), if bound. */
  tagHash?: string;
  /** Raw flags byte from getAsset. */
  flags: number;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  provenance: ProvenanceEvent[];
}
