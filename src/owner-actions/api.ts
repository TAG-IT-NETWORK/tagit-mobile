/**
 * Client for the public owner-actions rail on tagit-services:
 *   GET  /api/v1/assets/:tokenId/owner-actions?owner=0x…   → this owner's actions
 *   POST /api/v1/assets/:tokenId/owner-actions              → submit a signed action
 *   GET  /api/v1/assets/:tokenId/price                      → listing state (404 = not listed)
 * No API key: the proof is the owner's signature, verified server-side
 * together with ownerOf on-chain.
 */
import { API_URL } from "../config/env";
import type { OwnerActionKind, OwnerActionParams } from "./message";
import type { SaleState } from "./rules";

export interface OwnerActionView {
  id: number;
  tokenId: string;
  action: OwnerActionKind;
  /** executed | scheduled | cancelled | failed */
  status: string;
  params: Record<string, unknown>;
  executeAt: string | null;
  executedAt: string | null;
  txHash: string | null;
  error: string | null;
  createdAt: string;
}

export class OwnerActionsApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "OwnerActionsApiError";
  }
}

async function errorFrom(res: Response): Promise<OwnerActionsApiError> {
  let message = `HTTP ${res.status}`;
  try {
    const body = (await res.json()) as { error?: unknown; message?: unknown };
    const err = body.error;
    if (typeof err === "string") message = err;
    else if (err && typeof err === "object" && typeof (err as { message?: unknown }).message === "string") {
      message = (err as { message: string }).message;
    } else if (typeof body.message === "string") message = body.message;
  } catch {
    /* non-JSON body */
  }
  return new OwnerActionsApiError(message, res.status);
}

export async function fetchOwnerActions(tokenId: string, owner: string): Promise<OwnerActionView[]> {
  const res = await fetch(`${API_URL}/api/v1/assets/${tokenId}/owner-actions?owner=${owner}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await errorFrom(res);
  const body = (await res.json()) as { actions?: OwnerActionView[] };
  return Array.isArray(body.actions) ? body.actions : [];
}

export interface SubmitOwnerActionRequest {
  tokenId: string;
  action: OwnerActionKind;
  params: OwnerActionParams;
  owner: string;
  signature: string;
  timestamp: number;
}

export async function submitOwnerAction(req: SubmitOwnerActionRequest): Promise<OwnerActionView> {
  const res = await fetch(`${API_URL}/api/v1/assets/${req.tokenId}/owner-actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      action: req.action,
      params: req.params,
      owner: req.owner,
      signature: req.signature,
      timestamp: req.timestamp,
      source: "app",
    }),
  });
  if (!res.ok) throw await errorFrom(res);
  const body = (await res.json()) as { action: OwnerActionView };
  return body.action;
}

/** Listing state from the public price endpoint (404 = not listed). */
export async function fetchSaleState(tokenId: string): Promise<{ saleState: SaleState; display?: string }> {
  const res = await fetch(`${API_URL}/api/v1/assets/${tokenId}/price`, { headers: { Accept: "application/json" } });
  if (res.status === 404) return { saleState: "not-listed" };
  if (!res.ok) return { saleState: "unknown" };
  const body = (await res.json()) as { saleState?: string; display?: string };
  return { saleState: body.saleState === "listed" ? "listed" : "not-listed", display: body.display };
}
