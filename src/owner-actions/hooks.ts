/**
 * React seams for owner actions.
 *   useOwnerAction()                 sign (OS prompt) → POST → result
 *   useOwnerActionsFeed(token, owner) this owner's actions + pending recycle
 *   useSaleState(token)              listed / not listed
 */
import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import { fetchOwnerActions, fetchSaleState, submitOwnerAction, type OwnerActionView } from "./api";
import { ownerActionMessage, type OwnerActionKind, type OwnerActionParams } from "./message";
import type { SaleState } from "./rules";
import { signOwnerActionMessage } from "../wallet/sign-message";

export type OwnerActionPhase = "idle" | "signing" | "submitting" | "done" | "error";

// Typed custody errors carry user-safe copy; API validation / ownership
// errors are already plain English from the server. Anything else is replaced
// with a generic line so nothing internal leaks to the screen.
const FRIENDLY = new Set(["NoWalletError", "KeyInvalidatedError", "KeyMismatchError", "UnscopedMessageError"]);

function friendly(e: unknown): string {
  if (e instanceof Error && FRIENDLY.has(e.name)) return e.message;
  if (e instanceof Error && e.name === "OwnerActionsApiError") {
    const status = (e as { statusCode?: number }).statusCode ?? 0;
    if (status === 403) return "Only the wallet that owns this asset on-chain can do this.";
    if (status === 429) return "Too many actions in a minute — please wait and try again.";
    if (status === 400 || status === 404) return e.message;
    return "The network is busy right now — please try again in a moment.";
  }
  return "Could not confirm the action. Please try again.";
}

export function useOwnerAction() {
  const [phase, setPhase] = useState<OwnerActionPhase>("idle");
  const [result, setResult] = useState<OwnerActionView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (input: { tokenId: string; action: OwnerActionKind; params: OwnerActionParams; owner: Address; prompt: string }) => {
      if (phase === "signing" || phase === "submitting") return; // ignore a second tap
      setError(null);
      setPhase("signing");
      const timestamp = Date.now();
      const message = ownerActionMessage(input.tokenId, input.action, input.params, timestamp);
      let signature: string;
      try {
        signature = await signOwnerActionMessage(input.owner, message, input.prompt);
      } catch (e) {
        setError(friendly(e));
        setPhase("error");
        return;
      }
      setPhase("submitting");
      try {
        const view = await submitOwnerAction({
          tokenId: input.tokenId,
          action: input.action,
          params: input.params,
          owner: input.owner,
          signature,
          timestamp,
        });
        setResult(view);
        setPhase("done");
      } catch (e) {
        setError(friendly(e));
        setPhase("error");
      }
    },
    [phase],
  );

  const reset = useCallback(() => {
    setPhase("idle");
    setError(null);
    setResult(null);
  }, []);

  return { phase, result, error, run, reset };
}

export function useOwnerActionsFeed(tokenId: string, owner: string | null) {
  const [actions, setActions] = useState<OwnerActionView[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    if (!owner) {
      setActions([]);
      setLoaded(true);
      return;
    }
    try {
      setActions(await fetchOwnerActions(tokenId, owner));
    } catch {
      setActions([]); // feed is decoration; the buttons still work
    } finally {
      setLoaded(true);
    }
  }, [tokenId, owner]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const pendingRecycle = actions.find((a) => a.action === "recycle" && a.status === "scheduled") ?? null;
  return { actions, pendingRecycle, loaded, reload };
}

export function useSaleState(tokenId: string) {
  const [saleState, setSaleState] = useState<SaleState>("unknown");
  const [display, setDisplay] = useState<string | undefined>(undefined);

  const reload = useCallback(async () => {
    try {
      const r = await fetchSaleState(tokenId);
      setSaleState(r.saleState);
      setDisplay(r.display);
    } catch {
      setSaleState("unknown");
    }
  }, [tokenId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { saleState, display, reload };
}
