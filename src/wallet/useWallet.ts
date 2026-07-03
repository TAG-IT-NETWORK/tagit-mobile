/**
 * Public wallet hook — the single seam UI uses to read the active account and
 * trigger connect flows.
 *
 * v1 implements the embedded EOA path (createEmbedded / restore). WalletConnect
 * (connect) lands once a Reown projectId is configured; the gasless smart
 * account (deploySmartAccount) lands in Phase 4. They slot in behind this same
 * interface so screens never change.
 */
import { useCallback } from "react";
import { useWalletStore } from "./store";
import { loadOrCreateEmbeddedWallet, loadEmbeddedWallet, clearEmbeddedWallet } from "./embedded";
import { connectExternalWallet, WALLETCONNECT_AVAILABLE } from "./walletconnect";

export function useWallet() {
  const state = useWalletStore();

  /**
   * Create the on-device wallet (first-run onboarding). Uses loadOrCreate so a
   * stray tap can never overwrite an existing key — if one exists it is simply
   * restored (SEC_TRANSFER_STRIDE.md precondition 1).
   */
  const createEmbedded = useCallback(async () => {
    const { setStatus, setEmbedded, setRestored } = useWalletStore.getState();
    setStatus("connecting");
    try {
      const w = await loadOrCreateEmbeddedWallet();
      // Smart-account address is derived/deployed later (Phase 4); null for now.
      setEmbedded(w.address, null);
      setRestored();
      return w.address;
    } catch (e) {
      setStatus("error", e instanceof Error ? e.message : "Failed to create wallet");
      throw e;
    }
  }, []);

  /**
   * Restore a previously-created embedded wallet on app launch. Marks the store
   * `restored` only on a clean result (found or confirmed absent) — a keystore
   * read failure leaves restored=false with status "error" so the UI offers
   * retry instead of onboarding (which could overwrite the key).
   */
  const restore = useCallback(async () => {
    const { setEmbedded, setRestored, setStatus } = useWalletStore.getState();
    try {
      const w = await loadEmbeddedWallet();
      // Clear any stale error from a previously-failed attempt before marking
      // the restore complete; setEmbedded sets "ready" when a wallet exists.
      if (w) setEmbedded(w.address, null);
      else setStatus("idle");
      setRestored();
      return w?.address ?? null;
    } catch (e) {
      setStatus("error", e instanceof Error ? e.message : "Could not read the device keystore");
      return null;
    }
  }, []);

  /** Connect a bring-your-own wallet via WalletConnect (when configured). */
  const connect = useCallback(async () => {
    const { setStatus } = useWalletStore.getState();
    setStatus("connecting");
    try {
      await connectExternalWallet();
    } catch (e) {
      setStatus("error", e instanceof Error ? e.message : "Failed to connect");
      throw e;
    }
  }, []);

  /** Remove the embedded wallet from the device and reset session. */
  const forget = useCallback(async () => {
    await clearEmbeddedWallet();
    useWalletStore.getState().disconnect();
  }, []);

  return {
    mode: state.mode,
    eoaAddress: state.eoaAddress,
    smartAccountAddress: state.smartAccountAddress,
    activeAddress: state.activeAddress,
    restored: state.restored,
    isAADeployed: state.isAADeployed,
    emailVerified: state.emailVerified,
    status: state.status,
    error: state.error,
    isConnected: state.status === "ready" && state.activeAddress !== null,
    walletConnectAvailable: WALLETCONNECT_AVAILABLE,
    createEmbedded,
    connect,
    restore,
    forget,
    disconnect: state.disconnect,
  };
}
