import { useState, useCallback } from "react";
import { useNfcScan, type NfcStatus } from "./useNfcScan";
import { buildVerifyRequest, verifyAsset, VerifyApiError } from "../services/api";
import { verifySunViaWeb } from "../services/sunVerify";
import { parseSunUrl } from "../services/nfc";
import { generateChallenge, checkApiHealth } from "../services/challenge";
import { addToHistory } from "../services/history";
import { DEMO_NFC_PAYLOAD } from "../config/constants";
import type { VerifyResponse } from "../types/api";
import type { SunData } from "../types/nfc";
import type { Challenge, ScanRecord } from "../types/challenge";

export type VerifyPhase =
  | "idle"
  | "health-check"
  | "challenging"
  | "scanning"
  | "verifying"
  | "done"
  | "error";

interface UseVerifyResult {
  /** Current phase of the scan→verify pipeline */
  phase: VerifyPhase;
  /** NFC hardware status */
  nfcStatus: NfcStatus;
  /** Verification result from the API */
  result: VerifyResponse | null;
  /** Parsed NFC SUN data */
  sunData: SunData | null;
  /** Generated challenge nonce */
  challenge: Challenge | null;
  /** Error message if any */
  error: string | null;
  /** Start NFC scan → API verify pipeline */
  startScan: (tokenIdOverride?: number) => Promise<void>;
  /** Start verification with demo payload (bypasses NFC) */
  startDemo: (tokenId?: number) => Promise<void>;
  /** Cancel any in-progress operation */
  cancel: () => void;
  /** Reset to idle state */
  reset: () => void;
}

function buildScanRecord(
  response: VerifyResponse,
  challenge: Challenge,
  sun: SunData | null,
): ScanRecord {
  return {
    id: challenge.nonce.slice(0, 8) + "-" + Date.now().toString(36),
    timestamp: new Date().toISOString(),
    tokenId: parseInt(response.asset.tokenId, 10) || 0,
    verified: response.verified,
    lifecycleState: response.asset.lifecycleState,
    chainName: response.chain.name,
    elapsedMs: response.elapsedMs,
    challenge,
    sunData: sun
      ? { uid: sun.uid, ctr: sun.ctr, cmac: sun.cmac }
      : null,
  };
}

export function useVerify(): UseVerifyResult {
  const { status: nfcStatus, scan, cancel: cancelNfc } = useNfcScan();
  const [phase, setPhase] = useState<VerifyPhase>("idle");
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [sunData, setSunData] = useState<SunData | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startScan = useCallback(async (tokenIdOverride?: number) => {
    setError(null);
    setResult(null);
    setSunData(null);
    setChallenge(null);

    try {
      // Phase 1: freshness nonce (local — no server needed)
      setPhase("challenging");
      const ch = await generateChallenge();
      setChallenge(ch);

      // Phase 2: NFC scan
      setPhase("scanning");
      const sun = await scan();
      setSunData(sun);

      // Phase 3: verify — route by SUN format
      if (sun.format === "encrypted") {
        // Real NTAG 424 DNA chip: the PICC is AES-encrypted and we have no SDM
        // key on-device, so verify server-side (verify.tagit.network).
        setPhase("verifying");
        const { response, uid } = await verifySunViaWeb(sun);
        const sunResolved = { ...sun, uid };
        setSunData(sunResolved);
        setResult(response);
        await addToHistory(buildScanRecord(response, ch, sunResolved));
        setPhase("done");
        return;
      }

      // Plaintext / Demo Mode: verify via the tagit-services oracle endpoint.
      setPhase("health-check");
      const healthy = await checkApiHealth();
      if (!healthy) throw new Error("Server unreachable — check your connection");

      setPhase("verifying");
      const request = buildVerifyRequest(sun, tokenIdOverride, ch);
      const response = await verifyAsset(request);
      setResult(response);
      await addToHistory(buildScanRecord(response, ch, sun));
      setPhase("done");
    } catch (err) {
      const msg = err instanceof VerifyApiError
        ? `API Error (${err.statusCode}): ${err.message}`
        : err instanceof Error
          ? err.message
          : "Verification failed";
      setError(msg);
      setPhase("error");
    }
  }, [scan]);

  const startDemo = useCallback(async (tokenId?: number) => {
    setError(null);
    setResult(null);
    setSunData(null);
    setChallenge(null);

    try {
      // Phase 1: health check
      setPhase("health-check");
      const healthy = await checkApiHealth();
      if (!healthy) throw new Error("Server unreachable — check your connection");

      // Phase 2: generate challenge
      setPhase("challenging");
      const ch = await generateChallenge();
      setChallenge(ch);

      // Phase 3: skip scanning in demo mode
      const sun = parseSunUrl(DEMO_NFC_PAYLOAD.rawUrl);
      setSunData(sun);

      // Phase 4: verify
      setPhase("verifying");
      const request = buildVerifyRequest(sun, tokenId ?? DEMO_NFC_PAYLOAD.tokenId, ch);
      const response = await verifyAsset(request);
      setResult(response);

      // Phase 5: persist
      await addToHistory(buildScanRecord(response, ch, sun));
      setPhase("done");
    } catch (err) {
      const msg = err instanceof VerifyApiError
        ? `API Error (${err.statusCode}): ${err.message}`
        : err instanceof Error
          ? err.message
          : "Demo verification failed";
      setError(msg);
      setPhase("error");
    }
  }, []);

  const cancel = useCallback(() => {
    cancelNfc();
    setPhase("idle");
    setError(null);
  }, [cancelNfc]);

  const reset = useCallback(() => {
    setPhase("idle");
    setResult(null);
    setSunData(null);
    setChallenge(null);
    setError(null);
  }, []);

  return {
    phase,
    nfcStatus,
    result,
    sunData,
    challenge,
    error,
    startScan,
    startDemo,
    cancel,
    reset,
  };
}
