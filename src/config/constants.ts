/** Lifecycle states matching TAGITCore.sol and tagit-services verify.ts */
export const LIFECYCLE_STATES = [
  "NONE",
  "MINTED",
  "BOUND",
  "ACTIVATED",
  "CLAIMED",
  "FLAGGED",
  "RECYCLED",
] as const;

export type LifecycleState = (typeof LIFECYCLE_STATES)[number];

/** Display names for lifecycle states */
export const STATE_DISPLAY_NAMES: Record<string, string> = {
  NONE: "None",
  MINTED: "Minted",
  BOUND: "Bound",
  ACTIVATED: "Activated",
  CLAIMED: "Claimed",
  FLAGGED: "Flagged",
  RECYCLED: "Recycled",
  UNKNOWN: "Unknown",
};

/** Colors per lifecycle state (tuned for WHITE badges, WCAG AA on tint) */
export const STATE_COLORS: Record<string, string> = {
  NONE: "#52525B",      // gray
  MINTED: "#6D28D9",    // violet (brand accent)
  BOUND: "#1D4ED8",     // blue
  ACTIVATED: "#065F46", // emerald
  CLAIMED: "#92400E",   // amber
  FLAGGED: "#B91C1C",   // red
  RECYCLED: "#52525B",  // gray
  UNKNOWN: "#52525B",
};

/** Shorten an address for display: 0x1234...abcd */
export function shortenAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/** Shorten a hash for display */
export function shortenHash(hash: string): string {
  if (hash.length < 16) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

/** Format a Unix timestamp for display */
export function formatTimestamp(ts: number): string {
  if (ts === 0) return "N/A";
  return new Date(ts * 1000).toLocaleString();
}

/** Demo NFC payload for when NFC hardware is unavailable */
export const DEMO_NFC_PAYLOAD = {
  uid: "049F5032A16C80",
  ctr: "000005",
  cmac: "2446E5A3B7F81D90",
  tokenId: 1,
  rawUrl: "https://tagit.network/verify?uid=049F5032A16C80&ctr=000005&cmac=2446E5A3B7F81D90&t=1",
};
