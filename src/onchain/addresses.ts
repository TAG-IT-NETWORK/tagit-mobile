/**
 * TAG IT Network — deployed contract addresses.
 *
 * v1 targets Base Sepolia (84532). Addresses sourced from
 * tagit-contracts/exports/addresses.json (Base Sepolia block) and verified
 * against Blockscout (base-sepolia.blockscout.com) during planning.
 */
import type { Address } from "viem";

export const BASE_SEPOLIA_CHAIN_ID = 84532 as const;

export type TagitAddresses = {
  TAGITCore: Address;
  TAGITToken: Address;
  TAGITAccount: Address;
  TAGITAccountFactory: Address;
  TAGITPaymaster: Address;
  VerificationEscrow: Address;
  TAGITRecovery: Address;
  TAGITAgentIdentity: Address;
  TAGITAgentReputation: Address;
  TAGITAgentValidation: Address;
  IdentityBadge: Address;
  CapabilityBadge: Address;
  EntryPoint: Address;
  trustedOracle: Address;
};

/** ERC-4337 v0.7 canonical EntryPoint (identical on every chain). */
export const ENTRY_POINT_V07: Address =
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

export const BASE_SEPOLIA_ADDRESSES: TagitAddresses = {
  TAGITCore: "0x3adC7eFdB58Ae85483Eff5D4966D916185F31D1d",
  TAGITToken: "0x746385e59aCB225779D64e74200e464a3f1C23d0", // wTAG on Base
  TAGITAccount: "0x2160044C7c46B08a552361595E09e8C8DDD06E85",
  TAGITAccountFactory: "0x3eD2C0e92f0E52dC68D04172Ad37Df4724893AD3",
  TAGITPaymaster: "0x6fFfA92eFb419e812d5c9C9D0c1b1A0F5C6FFd1c",
  VerificationEscrow: "0x4c9aACfcb64169E3BC187c227c4C0e0a5CFDA1cF",
  TAGITRecovery: "0x6Bc3c69367E586810a3b317fA9F0406504E95866",
  TAGITAgentIdentity: "0x0611FE60f6E37230bDaf04c5F2Ac2dc9012130a9",
  TAGITAgentReputation: "0x32be6C82A57d5bCe897538d7dA4109eA0eeB0aA1",
  TAGITAgentValidation: "0x34766dBa7040C2c8817f1Ee1e448209826DD607e",
  IdentityBadge: "0xebdAC9A0663c02a7297681b078aaD893EF345030",
  CapabilityBadge: "0xb05d22706B08A3F6409601de520cf7A6dbCB573d",
  EntryPoint: ENTRY_POINT_V07,
  trustedOracle: "0x458B4d0c3a55006965Fd13D6af7B8509De51Cb3D",
};

/** Lookup table keyed by chain id (only Base Sepolia for v1). */
export const ADDRESSES_BY_CHAIN: Record<number, TagitAddresses> = {
  [BASE_SEPOLIA_CHAIN_ID]: BASE_SEPOLIA_ADDRESSES,
};

export function getAddresses(chainId: number = BASE_SEPOLIA_CHAIN_ID): TagitAddresses {
  const a = ADDRESSES_BY_CHAIN[chainId];
  if (!a) throw new Error(`No TAG IT addresses configured for chain ${chainId}`);
  return a;
}
