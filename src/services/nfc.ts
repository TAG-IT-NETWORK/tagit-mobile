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
  // On iOS this message is shown on the mandatory system "Ready to Scan" sheet;
  // on Android there is no system sheet (the app renders its own hint) so the
  // option is simply ignored.
  await NfcManager.requestTechnology(NfcTech.Ndef, {
    alertMessage: "Hold your TAG IT chip near the top of your iPhone",
  });
  try {
    const tag = await NfcManager.getTag();
    if (!tag?.ndefMessage?.length) {
      // setAlertMessage updates the iOS sheet text; it's a no-op on Android.
      await NfcManager.setAlertMessage("No chip detected — try again");
      throw new Error("No NDEF message found on tag");
    }

    // Find the first URI record
    for (const record of tag.ndefMessage) {
      if (record.tnf === Ndef.TNF_WELL_KNOWN) {
        const payload = new Uint8Array(record.payload as unknown as number[]);
        const uri = Ndef.uri.decodePayload(payload);
        if (uri) {
          await NfcManager.setAlertMessage("Chip read");
          return uri;
        }
      }
    }

    // Fallback: try to decode any text record as URL
    for (const record of tag.ndefMessage) {
      const payload = new Uint8Array(record.payload as unknown as number[]);
      const text = Ndef.text.decodePayload(payload);
      if (text?.startsWith("http")) {
        await NfcManager.setAlertMessage("Chip read");
        return text;
      }
    }

    await NfcManager.setAlertMessage("Unrecognized chip");
    throw new Error("No URL record found in NDEF message");
  } finally {
    NfcManager.cancelTechnologyRequest().catch(() => {});
  }
}

/**
 * Parse an NTAG 424 DNA SUN URL into structured data.
 *
 * Two SUN formats are supported:
 *   ENCRYPTED PICC (real chips, what tagit-nfc-bridge personalizes):
 *     https://verify.tagit.network/sun?picc=<32 hex>&cmac=<16 hex>
 *     https://id.tagit.network/01/{GTIN}/21/{serial}?picc=<32 hex>&cmac=<16 hex>
 *     → UID + counter are AES-encrypted inside `picc`; the app can't decrypt them
 *       on-device, so verification is delegated to the server (see verifySunViaWeb).
 *   PLAINTEXT UID (legacy / Demo Mode):
 *     https://tagit.network/verify?uid=049F50...&ctr=000005&cmac=2446E5...&t=1
 *     → UID/counter in the clear; verified via the tagit-services oracle endpoint.
 */
export function parseSunUrl(rawUrl: string): SunData {
  const url = new URL(rawUrl);
  const params = url.searchParams;

  // `picc`/`picc_data` is the ENCRYPTED PICC mirror; `uid` is a plaintext UID.
  const picc = params.get("picc") ?? params.get("picc_data") ?? "";
  const uid = params.get("uid") ?? "";
  const ctr = params.get("ctr") ?? params.get("counter") ?? "";
  const cmac = params.get("cmac") ?? params.get("mac") ?? "";

  // Token ID from ?t= param or a numeric URL path segment (hint only; for GS1
  // Digital Link the last segment is a serial, not a token id → stays 0 and the
  // server resolves the real token from the decrypted UID).
  let tokenId = 0;
  const tParam = params.get("t") ?? params.get("tokenId") ?? params.get("token");
  if (tParam) {
    tokenId = parseInt(tParam, 10) || 0;
  } else {
    const pathParts = url.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && /^\d+$/.test(lastPart)) {
      tokenId = parseInt(lastPart, 10);
    }
  }

  if (!cmac) throw new Error("Missing CMAC in SUN URL");

  if (picc) {
    return { uid: "", picc, ctr, cmac, tokenId, rawUrl, format: "encrypted" };
  }
  if (uid) {
    return { uid, picc: "", ctr, cmac, tokenId, rawUrl, format: "plaintext" };
  }
  throw new Error("SUN URL is missing both picc and uid");
}

/** Cancel any pending NFC scan request */
export async function cancelScan(): Promise<void> {
  await NfcManager.cancelTechnologyRequest().catch(() => {});
}
