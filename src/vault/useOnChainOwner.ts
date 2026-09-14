/**
 * On-chain owner + state for one token, read straight from TAGITCore.getAsset.
 *
 * Why: tagit-services renders wallet addresses truncated ("0x3Ed1…F113") on
 * its public tier (REQ-S-14, no doxxing), so `asset.owner` from the API can't
 * be compared with the active wallet. Ownership gates (Send / Transfer, the
 * Manage section) must use the chain — the source of truth — not the API's
 * display string. One eth_call per asset page; null while loading / on RPC
 * failure (callers fall back to the API value, which then simply fails the
 * comparison — i.e. gates stay closed, never open by mistake).
 */
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { getPublicClient } from "../onchain/clients";
import { getAddresses } from "../onchain/addresses";
import { tagitCoreAbi } from "../onchain/abis/TAGITCore";

export interface OnChainAsset {
  owner: Address;
  stateCode: number;
}

export async function readOnChainAsset(tokenId: string): Promise<OnChainAsset> {
  const asset = (await getPublicClient().readContract({
    address: getAddresses().TAGITCore,
    abi: tagitCoreAbi,
    functionName: "getAsset",
    args: [BigInt(tokenId)],
  })) as readonly [Address, bigint, number, number, number];
  return { owner: asset[0], stateCode: Number(asset[2]) };
}

export function useOnChainOwner(tokenId: string, refresh?: number): OnChainAsset | null {
  const [value, setValue] = useState<OnChainAsset | null>(null);
  useEffect(() => {
    let cancelled = false;
    setValue(null);
    if (!/^\d+$/.test(tokenId)) return;
    readOnChainAsset(tokenId)
      .then((v) => {
        if (!cancelled) setValue(v);
      })
      .catch(() => {
        /* RPC hiccup: leave null → gates use the API value */
      });
    return () => {
      cancelled = true;
    };
  }, [tokenId, refresh]);
  return value;
}
