/**
 * Pure transfer helpers — no key material, no network. Everything here is
 * deterministic and unit-testable. The signer (signer.ts) is the only module
 * that combines these with the private key.
 *
 * Mechanism: TAGITCore.transferAsset(tokenId, to) — the sanctioned
 * consumer-to-consumer transfer (owner-gated, CLAIMED-only, enforced on-chain;
 * direct ERC-721 transfers are blocked by the contract). See
 * docs/SEC_TRANSFER_STRIDE.md.
 */
import {
  encodeFunctionData,
  decodeFunctionData,
  encodeAbiParameters,
  keccak256,
  getAddress,
  isAddress,
  type Address,
  type Hex,
} from "viem";
import { tagitCoreAbi } from "../onchain/abis/TAGITCore";

export const STATE_CLAIMED = 4;

/** Fields of the transaction that the confirmed preview is bound to. */
export interface CanonicalTx {
  to: Address; // the CONTRACT (TAGITCore), not the recipient
  value: bigint;
  data: Hex;
  chainId: number;
  nonce: number;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  gas: bigint;
}

export class InvalidRecipientError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "InvalidRecipientError";
  }
}

/** Calldata for transferAsset(tokenId, to). */
export function encodeTransferCalldata(tokenId: bigint, to: Address): Hex {
  return encodeFunctionData({ abi: tagitCoreAbi, functionName: "transferAsset", args: [tokenId, to] });
}

/**
 * Decode calldata back to (tokenId, to). The Confirm screen renders its
 * AUTHORITATIVE fields from THIS — never from UI state — so what the user
 * approves is exactly what will be signed.
 */
export function decodeTransfer(data: Hex): { tokenId: bigint; to: Address } {
  const { functionName, args } = decodeFunctionData({ abi: tagitCoreAbi, data });
  if (functionName !== "transferAsset") throw new Error(`unexpected calldata: ${functionName}`);
  const [tokenId, to] = args as readonly [bigint, Address];
  return { tokenId, to: getAddress(to) };
}

/** Hash binding the full canonical tx — recomputed by the signer before signing. */
export function computeCanonicalHash(tx: CanonicalTx): Hex {
  return keccak256(
    encodeAbiParameters(
      [
        { type: "address" },
        { type: "uint256" },
        { type: "bytes" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
      ],
      [
        tx.to,
        tx.value,
        tx.data,
        BigInt(tx.chainId),
        BigInt(tx.nonce),
        tx.maxFeePerGas,
        tx.maxPriorityFeePerGas,
        tx.gas,
      ],
    ),
  );
}

/**
 * Validate a recipient address. Checksum is TYPO detection only — a valid
 * attacker address passes; it is NOT a spoofing control (the full-address
 * Confirm screen + first-time-recipient warning are). Throws on
 * empty/malformed/zero/self.
 */
export function validateRecipient(input: string, from: Address): Address {
  const trimmed = input.trim();
  if (!trimmed) throw new InvalidRecipientError("Enter a recipient address.");
  if (!isAddress(trimmed)) throw new InvalidRecipientError("That is not a valid wallet address.");
  const to = getAddress(trimmed);
  if (to === "0x0000000000000000000000000000000000000000")
    throw new InvalidRecipientError("Cannot send to the zero address.");
  if (to.toLowerCase() === from.toLowerCase())
    throw new InvalidRecipientError("That is your own wallet address.");
  return to;
}

/** Group a 0x address into 4-char blocks for unambiguous on-screen review. */
export function groupAddress(addr: Address): string {
  const body = addr.slice(2);
  return "0x " + (body.match(/.{1,4}/g) ?? []).join(" ");
}
