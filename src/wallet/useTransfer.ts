/**
 * Transfer flow state machine for the UI. Wraps the signer:
 *   prepare(recipient) -> read-only preflight + build -> "review"
 *   confirm()          -> biometric + sign + broadcast -> "pending" -> "confirmed"
 * A failed confirm (e.g. cancelled biometric) returns to "review" so the user
 * can retry; a broadcast that lands but whose receipt is slow stays "pending".
 */
import { useCallback, useState } from "react";
import type { Address, Hex } from "viem";
import { prepareTransfer, type PreparedTransfer } from "./signer";
import { getPublicClient } from "../onchain/clients";

export type TransferPhase =
  | "idle"
  | "preparing"
  | "review"
  | "signing"
  | "pending"
  | "confirmed"
  | "error";

// Our typed preflight/custody errors carry user-safe copy; anything else
// (raw viem revert dumps embedding calldata/args) is replaced with a generic
// line so nothing leaks to the screen.
const FRIENDLY_ERRORS = new Set([
  "NotOwnerError",
  "NotClaimedError",
  "KeyMismatchError",
  "KeyInvalidatedError",
  "NoWalletError",
  "PreviewDriftError",
  "AlreadySignedError",
  "InvalidRecipientError",
]);
function message(e: unknown): string {
  if (e instanceof Error && FRIENDLY_ERRORS.has(e.name)) return e.message;
  return "Could not complete the transfer. Please try again.";
}

export function useTransfer(from: Address, tokenId: bigint) {
  const [phase, setPhase] = useState<TransferPhase>("idle");
  const [prepared, setPrepared] = useState<PreparedTransfer | null>(null);
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const [error, setError] = useState<string | null>(null);

  const prepare = useCallback(
    async (to: Address) => {
      setPhase("preparing");
      setError(null);
      try {
        const p = await prepareTransfer(from, tokenId, to);
        setPrepared(p);
        setPhase("review");
      } catch (e) {
        setError(message(e));
        setPhase("error");
      }
    },
    [from, tokenId],
  );

  const confirm = useCallback(async () => {
    if (!prepared) return;
    if (phase !== "review") return; // ignore a second tap while already signing/pending
    setPhase("signing");
    setError(null);
    let hash: Hex;
    try {
      hash = await prepared.confirm(); // OS biometric → sign → broadcast
    } catch (e) {
      setError(message(e));
      setPhase("review"); // retry allowed (nothing was broadcast on failure)
      return;
    }
    setTxHash(hash);
    setPhase("pending");
    try {
      await getPublicClient().waitForTransactionReceipt({ hash, timeout: 60_000 });
      setPhase("confirmed");
    } catch {
      // Broadcast succeeded; the network is just slow to confirm. Leave it
      // pending — the tx is on its way, retrying would double-send.
      setPhase("pending");
    }
  }, [prepared, phase]);

  const reset = useCallback(() => {
    setPhase("idle");
    setPrepared(null);
    setTxHash(null);
    setError(null);
  }, []);

  return { phase, prepared, txHash, error, prepare, confirm, reset };
}
