/**
 * Reown AppKit (WalletConnect) — external "bring-your-own-wallet" connection.
 *
 * Lets users connect MetaMask / Rainbow / Coinbase Wallet / etc. via WalletConnect
 * v2, alongside the existing on-device embedded wallet.
 *
 * Pinned to a porto-free stack (wagmi 2.17.2) so it builds on Expo SDK 52 / RN
 * 0.76 with no SDK upgrade. The ENTIRE thing is gated on a projectId: with
 * EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID unset, no AppKit machinery is created and
 * the app boots on the embedded-wallet path exactly as before.
 *
 * Get a free projectId at https://dashboard.reown.com and set it in
 * tagit-mobile/.env AND in eas.json's per-profile `env` blocks (EAS ignores .env).
 */
import { WagmiAdapter } from "@reown/appkit-wagmi-react-native";
import { createAppKit, AppKit, AppKitProvider } from "@reown/appkit-react-native";
import type { Storage } from "@reown/appkit-react-native";
import { QueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { baseSepolia } from "viem/chains";
import type { Config } from "wagmi";

/** AppKit persistence (WC session, recent wallet) backed by AsyncStorage. */
const wcStorage: Storage = {
  async getKeys() {
    return [...(await AsyncStorage.getAllKeys())];
  },
  async getEntries<T = unknown>() {
    const keys = await AsyncStorage.getAllKeys();
    const entries = await AsyncStorage.multiGet(keys);
    return entries.map(([k, v]) => [k, v != null ? (JSON.parse(v) as T) : (undefined as T)]) as [
      string,
      T,
    ][];
  },
  async getItem<T = unknown>(key: string) {
    const v = await AsyncStorage.getItem(key);
    return v != null ? (JSON.parse(v) as T) : undefined;
  },
  async setItem<T = unknown>(key: string, value: T) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
  },
};

export const WC_PROJECT_ID = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
export const WALLETCONNECT_AVAILABLE = WC_PROJECT_ID.length > 0;

const metadata = {
  name: "TAG IT",
  description: "Verify the authenticity of your TAG IT–chipped items.",
  url: "https://tagit.network",
  icons: ["https://tagit.network/icon.png"],
  redirect: { native: "oracular://", universal: "https://tagit.network" },
};

let wagmiConfig: Config | null = null;
let appKit: ReturnType<typeof createAppKit> | null = null;
let queryClient: QueryClient | null = null;
let initError: string | null = null;

if (WALLETCONNECT_AVAILABLE) {
  // NEVER let a WalletConnect init failure crash app launch — degrade to the
  // embedded-wallet path and surface the reason (see Settings).
  try {
    const networks = [baseSepolia] as const;
    const adapter = new WagmiAdapter({ networks, projectId: WC_PROJECT_ID });
    appKit = createAppKit({
      projectId: WC_PROJECT_ID,
      metadata,
      adapters: [adapter],
      storage: wcStorage,
      // AppKit's Network[] and viem's Chain are structurally the same here.
      networks: [baseSepolia] as never,
    });
    wagmiConfig = adapter.wagmiConfig;
    queryClient = new QueryClient();
  } catch (e) {
    initError = e instanceof Error ? e.message : String(e);
    wagmiConfig = null;
    appKit = null;
    queryClient = null;
    // eslint-disable-next-line no-console
    console.warn("[walletconnect] AppKit init failed; external wallet disabled:", e);
  }
}

/** Non-null when WalletConnect was configured but failed to initialize. */
export const WC_INIT_ERROR = initError;

export { wagmiConfig, appKit, queryClient, AppKit, AppKitProvider };

/**
 * Module-level bridge so useWallet (used across the app, often outside the WC
 * providers) can trigger the connect modal WITHOUT calling the useAppKit() hook
 * itself. WalletSyncBridge — mounted under the providers — registers `open` here.
 */
let openModalFn: (() => Promise<void> | void) | null = null;

export function registerOpenModal(fn: (() => Promise<void> | void) | null): void {
  openModalFn = fn;
}

export async function openConnectModal(): Promise<void> {
  if (!openModalFn) throw new Error("WalletConnect isn't ready yet.");
  await openModalFn();
}

let disconnectFn: (() => Promise<void> | void) | null = null;

export function registerDisconnect(fn: (() => Promise<void> | void) | null): void {
  disconnectFn = fn;
}

/** End the external-wallet session (wagmi disconnect). No-op if not connected. */
export async function requestDisconnect(): Promise<void> {
  if (disconnectFn) await disconnectFn();
}
