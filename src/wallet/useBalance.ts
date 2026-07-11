/**
 * Base Sepolia ETH balance for an address (for gas visibility). Read directly
 * via the public client; refreshes on demand and when the address changes.
 */
import { useCallback, useEffect, useState } from "react";
import { formatEther, type Address } from "viem";
import { getPublicClient } from "../onchain/clients";

export function useBalance(address: Address | null) {
  const [wei, setWei] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!address) {
      setWei(null);
      return;
    }
    setLoading(true);
    try {
      const b = await getPublicClient().getBalance({ address });
      setWei(b);
    } catch {
      // Leave the previous value; a transient RPC hiccup shouldn't blank it.
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Trim to 4 decimals for display (e.g. "0.0040").
  const eth = wei === null ? null : Number(formatEther(wei)).toFixed(4);
  return { wei, eth, loading, refresh };
}
