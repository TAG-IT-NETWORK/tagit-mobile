import NfcManager, { NfcTech, Ndef } from "react-native-nfc-manager";
import type { SunData } from "../types/nfc";

/** Check NFC support and start NfcManager */
export async function initNfc(): Promise<boolean> {
  const supported = await NfcManager.isSupported();
  if (!supported) return false;
  await NfcManager.start();
  return true;
}

/** Request NDEF technology and read the first NDEF URL record */
export async function scanNfcTag(): Promise<string> {
  await NfcManager.requestTechnology(NfcTech.Ndef);
  try {
    const tag = await NfcManager.getTag();
    if (!tag?.ndefMessage?.length) {
      throw new Error("No NDEF message found on tag");
    }

    // Find the first URI record
    for (const record of tag.ndefMessage) {
      if (record.tnf === Ndef.TNF_WELL_KNOWN) {
        const payload = new Uint8Array(record.payload as unknown as number[]);
        const uri = Ndef.uri.decodePayload(payload);
        if (uri) return uri;
      }
    }

    // Fallback: try to decode any text record as URL
    for (const record of tag.ndefMessage) {
      const payload = new Uint8Array(record.payload as unknown as number[]);
      const text = Ndef.text.decodePayload(payload);
      if (text?.startsWith("http")) return text;
    }

    throw new Error("No URL record found in NDEF message");
  } finally {
    NfcManager.cancelTechnologyRequest().catch(() => {});
  }
}

/**
 * Parse an NTAG 424 DNA SUN URL into structured data.
 *
 * Expected URL formats:
 *   https://tagit.network/verify?uid=049F50...&ctr=000005&cmac=2446E5...&t=1
 *   https://example.com/v?picc_data=...&cmac=...
 *
 * The NTAG 424 DNA chip automatically embeds UID, counter, and CMAC
 * into the NDEF URL on each tap via SUN (Secure Unique NFC) mirroring.
 */
export function parseSunUrl(rawUrl: string): SunData {
  const url = new URL(rawUrl);
  const params = url.searchParams;

  const uid = params.get("uid") ?? params.get("picc_data") ?? "";
  const ctr = params.get("ctr") ?? params.get("counter") ?? "";
  const cmac = params.get("cmac") ?? params.get("mac") ?? "";

  // Token ID from ?t= param or from URL path segment
  let tokenId = 0;
  const tParam = params.get("t") ?? params.get("tokenId") ?? params.get("token");
  if (tParam) {
    tokenId = parseInt(tParam, 10) || 0;
  } else {
    // Try path: /verify/1 or /t/1
    const pathParts = url.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && /^\d+$/.test(lastPart)) {
      tokenId = parseInt(lastPart, 10);
    }
  }

  if (!uid) throw new Error("Missing UID in SUN URL");
  if (!cmac) throw new Error("Missing CMAC in SUN URL");

  return { uid, ctr, cmac, tokenId, rawUrl };
}

/** Cancel any pending NFC scan request */
export async function cancelScan(): Promise<void> {
  await NfcManager.cancelTechnologyRequest().catch(() => {});
}
