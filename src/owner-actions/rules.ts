/**
 * Which owner actions the app offers for an asset — pure, unit-tested.
 * Mirrors the contract's lifecycle rules (flag from BOUND|ACTIVATED|CLAIMED,
 * recycle from any live state) and the marketplace's listing rules (sell only
 * a CLAIMED asset). Ownership is decided by the ACTIVE wallet, the only key
 * this device can sign with.
 */
import type { OwnerActionKind } from "./message";

/** uint8 lifecycle codes (TAGITCore). Asserted against LIFECYCLE_STATES in tests. */
export const STATE = { BOUND: 2, ACTIVATED: 3, CLAIMED: 4, FLAGGED: 5, RECYCLED: 6 } as const;

export type SaleState = "listed" | "not-listed" | "unknown";

export interface OwnerActionContext {
  stateCode: number;
  /** Active wallet is the on-chain owner. */
  isOwner: boolean;
  saleState: SaleState;
  /** A recycle is scheduled (grace period running). */
  pendingRecycle: boolean;
}

export function availableActions(ctx: OwnerActionContext): OwnerActionKind[] {
  if (!ctx.isOwner) return [];
  if (ctx.pendingRecycle) return ["cancel-recycle"];
  const s = ctx.stateCode;
  const live = s === STATE.BOUND || s === STATE.ACTIVATED || s === STATE.CLAIMED;
  if (!live) return []; // FLAGGED → the brand resolves; RECYCLED → terminal; MINTED → not yours yet
  const out: OwnerActionKind[] = [];
  if (s === STATE.CLAIMED) out.push(ctx.saleState === "listed" ? "delist" : "list");
  out.push("flag", "recycle");
  return out;
}

/**
 * Why the owner has nothing to do right now — shown in the Manage section so
 * the section is discoverable even when no action applies. null = actions exist.
 */
export function unavailableReason(ctx: OwnerActionContext): string | null {
  if (!ctx.isOwner) return null;
  if (availableActions(ctx).length > 0) return null;
  switch (ctx.stateCode) {
    case STATE.FLAGGED:
      return "This asset is flagged. The brand is reviewing it — nothing to manage until the report is resolved.";
    case STATE.RECYCLED:
      return "This asset has been recycled and retired. No further actions.";
    default:
      return "Owner actions unlock once the asset is bound and activated.";
  }
}
