/**
 * Minimal TAGITCore (ERC-721 digital twin) ABI for read access + provenance.
 *
 * Sourced verbatim from tagit-contracts/exports/abis/TAGITCore.json. Only the
 * entries the app needs are included. NOTE the `getAsset` output ordering is
 * (owner, timestamp, state, flags, reserved) — this is the authoritative order
 * from the contract artifact (a stale minimal ABI elsewhere had it wrong).
 *
 * `as const` is required so viem can infer return types.
 */
export const tagitCoreAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getAsset",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "timestamp", type: "uint64" },
      { name: "state", type: "uint8" },
      { name: "flags", type: "uint8" },
      { name: "reserved", type: "uint16" },
    ],
  },
  {
    type: "function",
    name: "getTagByToken",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "event",
    name: "AssetMinted",
    anonymous: false,
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "metadata", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "TagBound",
    anonymous: false,
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "tagHash", type: "bytes32", indexed: true },
    ],
  },
  {
    type: "event",
    name: "StateChanged",
    anonymous: false,
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "from", type: "uint8", indexed: false },
      { name: "to", type: "uint8", indexed: false },
      { name: "actor", type: "address", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Transfer",
    anonymous: false,
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
    ],
  },
] as const;
