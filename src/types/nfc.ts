/** Parsed NTAG 424 DNA SUN URL data */
export interface SunData {
  /** Plaintext UID (legacy/demo chips). Empty for encrypted-PICC chips until
   *  the server resolves it. No 0x prefix. */
  uid: string;
  /** Encrypted PICC blob (32 hex) for real SUN chips; "" for plaintext. */
  picc: string;
  /** Counter as hex string from the URL (plaintext chips only). */
  ctr: string;
  /** Truncated SUN CMAC (hex, no 0x prefix). */
  cmac: string;
  /** Token id parsed from the URL, if numeric (hint only; server is authoritative). */
  tokenId: number;
  /** Full NDEF URL. */
  rawUrl: string;
  /** Which SUN format the tag emitted. */
  format: "plaintext" | "encrypted";
}
