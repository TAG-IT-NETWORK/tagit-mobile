/**
 * Minimal TAGITAccountFactory ABI: counterfactual address + email gate.
 * Sourced from tagit-contracts/src/account/TAGITAccountFactory.sol.
 */
export const accountFactoryAbi = [
  {
    type: "function",
    name: "getAddress",
    stateMutability: "view",
    inputs: [
      { name: "emailHash", type: "bytes32" },
      { name: "salt", type: "uint256" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "isEmailVerified",
    stateMutability: "view",
    inputs: [{ name: "emailHash", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "createAccountWithOwner",
    stateMutability: "nonpayable",
    inputs: [
      { name: "emailHash", type: "bytes32" },
      { name: "salt", type: "uint256" },
      { name: "initialOwner", type: "address" },
    ],
    outputs: [{ name: "account", type: "address" }],
  },
] as const;
