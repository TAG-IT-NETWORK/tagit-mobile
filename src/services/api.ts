import { API_URL, API_KEY } from "../config/env";
import type { VerifyRequest, VerifyResponse } from "../types/api";
import type { SunData } from "../types/nfc";
import type { Challenge } from "../types/challenge";

export class VerifyApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "VerifyApiError";
  }
}

/** Ensure a hex string has 0x prefix */
function hexPrefix(hex: string): string {
  return hex.startsWith("0x") ? hex : `0x${hex}`;
}

/** Convert SUN URL data into the API request format */
export function buildVerifyRequest(
  sun: SunData,
  tokenIdOverride?: number,
  challenge?: Challenge,
): VerifyRequest {
  const counter = sun.ctr ? parseInt(sun.ctr, 16) : 0;
  return {
    tokenId: tokenIdOverride ?? sun.tokenId,
    nfcPayload: {
      uid: hexPrefix(sun.uid),
      cmac: hexPrefix(sun.cmac),
      counter,
    },
    ...(challenge && { challenge }),
  };
}

/** POST to /api/v1/verify and return the structured response */
export async function verifyAsset(request: VerifyRequest): Promise<VerifyResponse> {
  const url = `${API_URL}/api/v1/verify`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.error ?? body.message ?? message;
    } catch {
      // ignore parse errors
    }
    throw new VerifyApiError(message, res.status);
  }

  return res.json() as Promise<VerifyResponse>;
}
