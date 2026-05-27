import { useState, useEffect, useCallback, useRef } from "react";
import { initNfc, scanNfcTag, parseSunUrl, cancelScan } from "../services/nfc";
import type { SunData } from "../types/nfc";

export type NfcStatus = "init" | "ready" | "scanning" | "unsupported";

interface UseNfcScanResult {
  status: NfcStatus;
  scan: () => Promise<SunData>;
  cancel: () => void;
  error: string | null;
}

export function useNfcScan(): UseNfcScanResult {
  const [status, setStatus] = useState<NfcStatus>("init");
  const [error, setError] = useState<string | null>(null);
  const scanning = useRef(false);

  useEffect(() => {
    initNfc().then((supported) => {
      setStatus(supported ? "ready" : "unsupported");
    }).catch(() => {
      setStatus("unsupported");
    });
  }, []);

  const scan = useCallback(async (): Promise<SunData> => {
    if (scanning.current) throw new Error("Scan already in progress");
    scanning.current = true;
    setError(null);
    setStatus("scanning");

    try {
      const url = await scanNfcTag();
      const sunData = parseSunUrl(url);
      setStatus("ready");
      return sunData;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "NFC scan failed";
      setError(msg);
      setStatus("ready");
      throw err;
    } finally {
      scanning.current = false;
    }
  }, []);

  const cancel = useCallback(() => {
    cancelScan();
    scanning.current = false;
    setStatus("ready");
    setError(null);
  }, []);

  return { status, scan, cancel, error };
}
