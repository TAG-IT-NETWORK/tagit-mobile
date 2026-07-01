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

/** Colors per lifecycle state (dark-theme friendly) */
export const STATE_COLORS: Record<string, string> = {
  NONE: "#6B7280",      // gray
  MINTED: "#8B5CF6",    // purple
  BOUND: "#3B82F6",     // blue
  ACTIVATED: "#10B981",  // green
  CLAIMED: "#F59E0B",   // amber
  FLAGGED: "#EF4444",   // red
  RECYCLED: "#6B7280",  // gray
  UNKNOWN: "#6B7280",
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
