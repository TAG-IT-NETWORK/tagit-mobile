/**
 * ERC-4337 smart-account helpers (Base Sepolia).
 *
 * v1 ships the *verifiable* read path — computing the counterfactual smart
 * account address from the factory — plus the email-hash helper shared with the
 * backend verifier. The gasless DEPLOY path (createAccountWithOwner via a
 * sponsored UserOperation) requires a bundler (Pimlico) + the email-verifier
 * service to have run verifyEmail() first; that is gated behind
 * EXPO_PUBLIC_ENABLE_AA and throws a clear error until wired (Phase 4 infra).
 */
import { keccak256, stringToBytes, getAddress, type Address, type Hex } from "viem";
import { getPublicClient } from "../onchain/clients";
import { getAddresses } from "../onchain/addresses";
import { accountFactoryAbi } from "../onchain/abis/TAGITAccountFactory";

/** Canonical email → bytes32 hash. MUST match tagit-services emailToHash(). */
export function emailToHash(email: string): Hex {
  return keccak256(stringToBytes(email.trim().toLowerCase()));
}

/**
 * Counterfactual smart-account address for (emailHash, salt) — derived from the
 * factory's CREATE2 prediction. Same regardless of owner (salt-based clone), so
 * it's stable to show before deployment. This is a real on-chain read.
 */
export async function predictSmartAccountAddress(
  email: string,
  salt: bigint = 0n,
): Promise<Address> {
  const { TAGITAccountFactory } = getAddresses();
  const addr = await getPublicClient().readContract({
    address: getAddress(TAGITAccountFactory),
    abi: accountFactoryAbi,
    functionName: "getAddress",
    args: [emailToHash(email), salt],
  });
  return getAddress(addr);
}

/** Whether the email has been verified on-chain (gate for createAccount). */
export async function isEmailVerified(email: string): Promise<boolean> {
  const { TAGITAccountFactory } = getAddresses();
  return getPublicClient().readContract({
    address: getAddress(TAGITAccountFactory),
    abi: accountFactoryAbi,
    functionName: "isEmailVerified",
    args: [emailToHash(email)],
  });
}

export const AA_ENABLED = process.env.EXPO_PUBLIC_ENABLE_AA === "true";

export class AANotConfiguredError extends Error {
  constructor() {
    super(
      "Gasless deploy needs a bundler + paymaster sponsorship and a verified email. " +
        "Set EXPO_PUBLIC_ENABLE_AA=true and configure Pimlico + EMAIL_VERIFIER once provisioned.",
    );
    this.name = "AANotConfiguredError";
  }
}

/**
 * Deploy the smart account gaslessly via a sponsored UserOperation.
 *
 * Wiring (Phase 4 infra) — once a Pimlico Base Sepolia v0.7 bundler URL and
 * TAGITPaymaster sponsorship are configured:
 *   1. Build the TAGITAccount as a permissionless custom account whose factory
 *      data is createAccountWithOwner(emailHash, salt, ownerEoa).
 *   2. Create a SmartAccountClient with the Pimlico bundler + paymaster
 *      (TAGITPaymaster at getAddresses().TAGITPaymaster, EntryPoint v0.7).
 *   3. Send a no-op / first UserOp; the EntryPoint deploys the account via the
 *      factory and the paymaster sponsors gas. Return the deployed address.
 * Prerequisite: the email must be verified on-chain (verifyEmail) first.
 */
export async function deploySmartAccount(_ownerPrivateKey: Hex, _email: string): Promise<Address> {
  if (!AA_ENABLED) throw new AANotConfiguredError();
  // Intentionally unimplemented until bundler + paymaster are provisioned; the
  // counterfactual address (predictSmartAccountAddress) is usable meanwhile.
  throw new AANotConfiguredError();
}
