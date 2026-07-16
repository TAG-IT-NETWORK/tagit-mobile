/**
 * Pure helpers for the Receive screen. Address-only — never touches key
 * material. The QR encodes the plain EIP-55 checksummed address: that is the
 * payload every mobile wallet scanner accepts (EIP-681 `ethereum:` URIs are
 * not uniformly supported by senders and would make some scans fail).
 */
import { getAddress, isAddress } from "viem";

/**
 * EIP-55 checksummed QR payload for a wallet address, or null when there is
 * no address to show. A mixed-case address with a WRONG checksum is rejected
 * (null) rather than repaired — never display a possibly-corrupted address as
 * a receive target. (getAddress alone would silently re-checksum it, so the
 * strict isAddress check must come first.)
 */
export function buildReceivePayload(address: string | null | undefined): string | null {
  if (!address || !isAddress(address, { strict: true })) return null;
  return getAddress(address);
}
