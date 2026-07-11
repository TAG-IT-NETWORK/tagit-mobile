/**
 * Transfer signer — the ONLY module that touches the private key for signing.
 *
 * CI import fence: `getSigningKey` (and the expo-secure-store surface) may not
 * be referenced outside src/wallet/. Security model: docs/SEC_TRANSFER_STRIDE.md.
 *
 * Flow: prepareTransfer() runs read-only preflight + builds the exact canonical
 * transaction and its binding hash, and returns a single-use confirm() closure.
 * confirm() is the ONLY path that retrieves the key (triggering the OS biometric
 * prompt), re-derives the tx, re-checks the canonical hash (self-consistency —
 * no drift between what was previewed and what is signed), asserts the key owns
 * the previewed sender, then signs + broadcasts exactly those bytes.
 */
import { createWalletClient as makeWallet, http as httpTransport } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import type { Address, Hex } from "viem";
import { getSigningKey } from "./embedded";
import { getPublicClient } from "../onchain/clients";
import { getAddresses, BASE_SEPOLIA_CHAIN_ID } from "../onchain/addresses";
import { tagitCoreAbi } from "../onchain/abis/TAGITCore";
import {
  STATE_CLAIMED,
  encodeTransferCalldata,
  decodeTransfer,
  computeCanonicalHash,
  type CanonicalTx,
} from "./transfer";

const RPC_URL = process.env.EXPO_PUBLIC_BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";

export class NotOwnerError extends Error {
  constructor() {
    super("This asset is not in your wallet.");
    this.name = "NotOwnerError";
  }
}
export class NotClaimedError extends Error {
  constructor(state: number) {
    super(`Only a claimed asset can be transferred (current state ${state}).`);
    this.name = "NotClaimedError";
  }
}
export class KeyMismatchError extends Error {
  constructor() {
    super("The device wallet key does not match the sender.");
    this.name = "KeyMismatchError";
  }
}
export class PreviewDriftError extends Error {
  constructor() {
    super("Transaction changed after confirmation — aborting.");
    this.name = "PreviewDriftError";
  }
}
export class AlreadySignedError extends Error {
  constructor() {
    super("This transfer was already signed.");
    this.name = "AlreadySignedError";
  }
}

export interface PreparedTransfer {
  tokenId: bigint;
  to: Address; // recipient
  from: Address; // sender (must equal the key's address at sign time)
  contract: Address; // TAGITCore
  chainId: number;
  nonce: number;
  gas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  calldata: Hex;
  canonicalHash: Hex;
  /** Sign + broadcast exactly the previewed tx. Single-use on success. */
  confirm: () => Promise<Hex>;
}

/**
 * Read-only preflight + build the canonical tx. Does NOT touch the key. The
 * gas estimate doubles as an on-chain simulation: a contract revert
 * (TransferDisabled / InvalidState / NotAssetOwner) surfaces here, before sign.
 */
export async function prepareTransfer(
  from: Address,
  tokenId: bigint,
  to: Address,
): Promise<PreparedTransfer> {
  const pub = getPublicClient();
  const contract = getAddresses().TAGITCore;

  const asset = (await pub.readContract({
    address: contract,
    abi: tagitCoreAbi,
    functionName: "getAsset",
    args: [tokenId],
  })) as readonly [Address, bigint, number, number, number];
  const [owner, , state] = asset;
  if (owner.toLowerCase() !== from.toLowerCase()) throw new NotOwnerError();
  if (state !== STATE_CLAIMED) throw new NotClaimedError(state);

  const data = encodeTransferCalldata(tokenId, to);
  const [nonce, fees, gasEstimate] = await Promise.all([
    pub.getTransactionCount({ address: from }),
    pub.estimateFeesPerGas(),
    pub.estimateContractGas({
      address: contract,
      abi: tagitCoreAbi,
      functionName: "transferAsset",
      args: [tokenId, to],
      account: from,
    }),
  ]);
  const gas = (gasEstimate * 12n) / 10n; // +20% headroom
  const maxFeePerGas = fees.maxFeePerGas;
  const maxPriorityFeePerGas = fees.maxPriorityFeePerGas;

  const canonical: CanonicalTx = {
    to: contract,
    value: 0n,
    data,
    chainId: BASE_SEPOLIA_CHAIN_ID,
    nonce,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gas,
  };
  const canonicalHash = computeCanonicalHash(canonical);

  let signed = false;
  let busy = false;

  const confirm = async (): Promise<Hex> => {
    if (signed) throw new AlreadySignedError();
    if (busy) throw new AlreadySignedError();
    busy = true;
    try {
      // Retrieve the key — triggers the OS biometric/passcode prompt.
      const pk = await getSigningKey(undefined, `Approve transfer of asset #${tokenId}`);
      const account = privateKeyToAccount(pk);
      if (account.address.toLowerCase() !== from.toLowerCase()) throw new KeyMismatchError();

      // Bind the previewed calldata to the exact args being signed: decode the
      // calldata the Confirm screen rendered (`data`) and assert it matches the
      // tokenId/to that writeContract will re-encode. This connects the two
      // representations (displayed calldata ↔ signed args); a divergence — the
      // preview showing one thing while another is signed — is refused.
      const previewed = decodeTransfer(data);
      if (previewed.tokenId !== tokenId || previewed.to.toLowerCase() !== to.toLowerCase()) {
        throw new PreviewDriftError();
      }

      const wallet = makeWallet({ account, chain: baseSepolia, transport: httpTransport(RPC_URL) });
      const hash = await wallet.writeContract({
        address: contract,
        abi: tagitCoreAbi,
        functionName: "transferAsset",
        args: [tokenId, to],
        nonce,
        gas,
        maxFeePerGas,
        maxPriorityFeePerGas,
      });
      signed = true;
      return hash;
    } finally {
      busy = false;
    }
  };

  return {
    tokenId,
    to,
    from,
    contract,
    chainId: BASE_SEPOLIA_CHAIN_ID,
    nonce,
    gas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    calldata: data,
    canonicalHash,
    confirm,
  };
}
