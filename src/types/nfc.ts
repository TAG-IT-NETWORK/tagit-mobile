/** Parsed NTAG 424 DNA SUN URL data */
export interface SunData {
  uid: string;      // raw hex from tag (no 0x prefix)
  ctr: string;      // counter as hex string from URL
  cmac: string;     // CMAC hex from URL (no 0x prefix)
  tokenId: number;  // extracted from URL path
  rawUrl: string;   // full NDEF URL
}
