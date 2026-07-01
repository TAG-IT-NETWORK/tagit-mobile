/**
 * Wallet/session store (Zustand).
 *
 * Single source of truth for the active account across tabs. Two modes:
 *  - "embedded":  on-device EOA (key in expo-secure-store) — default for
 *                 newcomers. Owns the ERC-4337 smart account.
 *  - "connected": bring-your-own wallet via WalletConnect / Reown AppKit.
 *
 * Phase 1 ships the shape + actions wiring points; Phase 3 fills embedded EOA
 * creation/connect, Phase 4 fills the gasless smart-account deploy. Keeping the
 * interface stable now means the AA signer slots in behind it without UI churn.
 */
import { create } from "zustand";
import type { Address } from "viem";

export type WalletMode = "embedded" | "connected";

export interface WalletState {
  mode: WalletMode | null;
  /** The signer/owner EOA address (embedded key or connected wallet). */
  eoaAddress: Address | null;
  /** Counterfactual or deployed ERC-4337 smart-account address. */
  smartAccountAddress: Address | null;
  /** True once the smart account is deployed on-chain (gasless ready). */
  isAADeployed: boolean;
  /** Verified email hash gate for the account factory, when embedded. */
  emailVerified: boolean;
  /** Becomes the active address used for Vault queries etc. */
  activeAddress: Address | null;
  status: "idle" | "connecting" | "ready" | "error";
  error: string | null;
}

export interface WalletActions {
  setEmbedded: (eoa: Address, smartAccount: Address | null) => void;
  setConnected: (eoa: Address) => void;
  setSmartAccount: (addr: Address, deployed: boolean) => void;
  setEmailVerified: (v: boolean) => void;
  setStatus: (s: WalletState["status"], error?: string | null) => void;
  disconnect: () => void;
}

const initialState: WalletState = {
  mode: null,
  eoaAddress: null,
  smartAccountAddress: null,
  isAADeployed: false,
  emailVerified: false,
  activeAddress: null,
  status: "idle",
  error: null,
};

export const useWalletStore = create<WalletState & WalletActions>((set) => ({
  ...initialState,

  setEmbedded: (eoa, smartAccount) =>
    set({
      mode: "embedded",
      eoaAddress: eoa,
      smartAccountAddress: smartAccount,
      // Prefer the smart account as the public-facing address when present.
      activeAddress: smartAccount ?? eoa,
      status: "ready",
      error: null,
    }),

  setConnected: (eoa) =>
    set({
      mode: "connected",
      eoaAddress: eoa,
      smartAccountAddress: null,
      activeAddress: eoa,
      status: "ready",
      error: null,
    }),

  setSmartAccount: (addr, deployed) =>
    set((s) => ({
      smartAccountAddress: addr,
      isAADeployed: deployed,
      activeAddress: s.mode === "embedded" ? addr : s.activeAddress,
    })),

  setEmailVerified: (v) => set({ emailVerified: v }),

  setStatus: (status, error = null) => set({ status, error }),

  disconnect: () => set({ ...initialState }),
}));
