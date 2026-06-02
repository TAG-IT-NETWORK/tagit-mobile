import { VERIFIER_URL } from "../config/env";
import { VerifyApiError } from "./api";
import type { SunData } from "../types/nfc";
import type { VerifyResponse } from "../types/api";

/** Shape returned by verify.tagit.network/api/verify (see apps/verify route). */
interface WebVerifyResponse {
  verified: boolean;
  bound?: boolean;
  reason?: string;
  error?: string;
  uid?: string;
  tapCounter?: number;
  asset?: {
    tokenId: string;
    stateCode: number;
    lifecycleState: string;
    owner: string;
    timestamp: number;
    name?: string;
    image?: string;
    brand?: string;
    sku?: string;
    origin?: string;
    msrp?: string;
  };
  metadataHash?: string | null;
  chain?: { id: number; name: string };
}

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

/**
 * Verify an encrypted-PICC SUN tap server-side and map the result onto the
 * app's existing VerifyResponse shape (so the Result screen renders unchanged).
 *
 * The chip's PICC is AES-encrypted and the device has no SDM key, so the
 * `picc`+`cmac` are forwarded to verify.tagit.network, which decrypts + checks
 * the CMAC and resolves the on-chain twin. Returns the resolved UID separately
 * so the caller can backfill it into the scan record (the URL had none in clear).
 */
export async function verifySunViaWeb(
  sun: SunData,
): Promise<{ response: VerifyResponse; uid: string }> {
  const t0 = Date.now();
  const endpoint =
    `${VERIFIER_URL}/api/verify` +
    `?picc=${encodeURIComponent(sun.picc)}&cmac=${encodeURIComponent(sun.cmac)}`;

  let res: Response;
  try {
    res = await fetch(endpoint, { headers: { Accept: "application/json" } });
  } catch {
    throw new VerifyApiError("Verifier unreachable — check your connection", 0);
  }

  let body: WebVerifyResponse;
  try {
    body = (await res.json()) as WebVerifyResponse;
  } catch {
    throw new VerifyApiError(`Verifier returned HTTP ${res.status}`, res.status);
  }

  // 4xx/5xx with a structured error (e.g. verifier not configured) → surface it.
  if (!res.ok && body?.error) {
    throw new VerifyApiError(body.error, res.status);
  }

  const elapsedMs = Date.now() - t0;
  const uid = body.uid ?? sun.uid;
  const chain = body.chain ?? { id: 84532, name: "Base Sepolia" };

  const asset = body.asset ?? {
    tokenId: "0",
    stateCode: 0,
    lifecycleState: body.reason ?? "UNVERIFIED",
    owner: ZERO_ADDR,
    timestamp: 0,
  };

  const response: VerifyResponse = {
    verified: body.verified,
    asset: {
      tokenId: asset.tokenId,
      lifecycleState: asset.lifecycleState,
      stateCode: asset.stateCode,
      owner: asset.owner,
      timestamp: asset.timestamp,
    },
    // SUN proof model: the chip's truncated AES-CMAC over the encrypted PICC is
    // the cryptographic attestation (verified server-side with the SDM key).
    proof: {
      signature: sun.cmac ? `0x${sun.cmac}` : "",
      messageHash: sun.picc ? `0x${sun.picc}` : "",
      oracleAddress: "",
      counter: body.tapCounter ?? 0,
      timestamp: Math.floor(t0 / 1000),
    },
    chain,
    elapsedMs,
  };

  return { response, uid };
}
