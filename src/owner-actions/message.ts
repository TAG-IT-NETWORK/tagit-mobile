/**
 * Owner-action message — MUST match tagit-services src/owner-actions/service.ts
 * byte for byte (the server rebuilds this string and verifies the signature
 * against it). Pure module: no React, no native deps, unit-tested against
 * golden vectors produced by the server implementation.
 *
 *   TAG IT owner action
 *   token: <tokenId>
 *   action: flag | list | delist | recycle | cancel-recycle
 *   params-sha256: <hex sha256 of canonical JSON params> | none
 *   ts: <unix ms>
 */
import { sha256, stringToBytes } from "viem";

export const OWNER_ACTIONS = ["flag", "list", "delist", "recycle", "cancel-recycle"] as const;
export type OwnerActionKind = (typeof OWNER_ACTIONS)[number];

/** Server accepts a signed timestamp only inside this window (both sides). */
export const OWNER_TS_WINDOW_MS = 15 * 60_000;
/** Server-side default grace before an app-initiated recycle executes. */
export const RECYCLE_GRACE_HOURS = 24;

export const MESSAGE_PREFIX = "TAG IT owner action";

export type OwnerActionParams = Record<string, string | number | boolean | null | undefined>;

/** Server rule for a listing price: up to 12 integer + 6 decimal digits, > 0. */
export const PRICE_RE = /^\d{1,12}(\.\d{1,6})?$/;

/** Canonical JSON: sorted keys, empty/null/undefined dropped, no whitespace. */
export function canonicalParams(params: OwnerActionParams | undefined): string {
  const src = params ?? {};
  const keys = Object.keys(src)
    .filter((k) => src[k] !== undefined && src[k] !== null && src[k] !== "")
    .sort();
  if (keys.length === 0) return "";
  return JSON.stringify(Object.fromEntries(keys.map((k) => [k, src[k]])));
}

/** Lowercase hex sha256 of the canonical params, or "none" when empty. */
export function paramsDigest(params: OwnerActionParams | undefined): string {
  const json = canonicalParams(params);
  return json ? sha256(stringToBytes(json)).slice(2) : "none";
}

export function ownerActionMessage(
  tokenId: string | bigint,
  action: OwnerActionKind,
  params: OwnerActionParams | undefined,
  timestamp: number,
): string {
  return [
    MESSAGE_PREFIX,
    `token: ${tokenId.toString()}`,
    `action: ${action}`,
    `params-sha256: ${paramsDigest(params)}`,
    `ts: ${timestamp}`,
  ].join("\n");
}

/**
 * Scope check used by the signer: the wallet signs ONLY strings in this exact
 * shape, so the message-signing path can never be repurposed for a permit,
 * a login challenge or any other text a malicious screen might feed it.
 */
export function isOwnerActionMessage(message: string): boolean {
  const lines = message.split("\n");
  return (
    lines.length === 5 &&
    lines[0] === MESSAGE_PREFIX &&
    /^token: \d+$/.test(lines[1]) &&
    OWNER_ACTIONS.some((a) => lines[2] === `action: ${a}`) &&
    /^params-sha256: ([0-9a-f]{64}|none)$/.test(lines[3]) &&
    /^ts: \d+$/.test(lines[4])
  );
}
