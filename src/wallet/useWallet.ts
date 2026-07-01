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
import { createEmbeddedWallet, loadEmbeddedWallet, clearEmbeddedWallet } from "./embedded";
import { connectExternalWallet, WALLETCONNECT_AVAILABLE } from "./walletconnect";

export function useWallet() {
  const state = useWalletStore();

  /** Create a fresh on-device wallet (first-run onboarding). */
  const createEmbedded = useCallback(async () => {
    const { setStatus, setEmbedded } = useWalletStore.getState();
    setStatus("connecting");
    try {
      const w = await createEmbeddedWallet();
      // Smart-account address is derived/deployed later (Phase 4); null for now.
      setEmbedded(w.address, null);
      return w.address;
    } catch (e) {
      setStatus("error", e instanceof Error ? e.message : "Failed to create wallet");
      throw e;
    }
  }, []);

  /** Restore a previously-created embedded wallet on app launch. */
  const restore = useCallback(async () => {
    const { setEmbedded } = useWalletStore.getState();
    const w = await loadEmbeddedWallet();
    if (w) setEmbedded(w.address, null);
    return w?.address ?? null;
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
