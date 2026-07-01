/**
 * WalletConnect (bring-your-own wallet) integration point.
 *
 * STATUS: wiring scaffold. The connect flow is gated on a Reown projectId AND a
 * deliberate dependency install, kept out of v1 by default for two reasons:
 *   1. Needs EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID (free, dashboard.reown.com).
 *   2. The React Native AppKit stack (@reown/appkit-wagmi-react-native + wagmi
 *      + @wagmi/connectors) currently pulls `porto`, whose peer requires
 *      react-native >= 0.81.4 — this app is on 0.76.6. Installing it risks a
 *      runtime crash, so we do NOT add it until RN is bumped or AppKit drops the
 *      hard porto peer. The embedded EOA path covers v1 onboarding meanwhile.
 *
 * To finish (once projectId + RN compatibility are sorted):
 *   pnpm add @reown/appkit-wagmi-react-native wagmi @tanstack/react-query \
 *     @walletconnect/react-native-compat
 *   - wrap App in WagmiProvider + QueryClientProvider + the AppKit provider
 *   - open the modal here, then call useWalletStore().setConnected(address)
 */
import { useWalletStore } from "./store";

export const WALLETCONNECT_PROJECT_ID =
  process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

export const WALLETCONNECT_AVAILABLE = WALLETCONNECT_PROJECT_ID.length > 0;

export class WalletConnectNotConfiguredError extends Error {
  constructor() {
    super(
      "WalletConnect isn't configured. Set EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID and install " +
        "@reown/appkit-wagmi-react-native (see wallet/walletconnect.ts).",
    );
    this.name = "WalletConnectNotConfiguredError";
  }
}

/**
 * Open the WalletConnect modal and, on success, record the connected EOA.
 * Throws until the AppKit dependency + projectId are in place.
 */
export async function connectExternalWallet(): Promise<void> {
  if (!WALLETCONNECT_AVAILABLE) throw new WalletConnectNotConfiguredError();
  // Placeholder for the AppKit open() → onConnect(address) flow:
  //   const address = await openAppKitAndAwaitConnection();
  //   useWalletStore.getState().setConnected(address);
  void useWalletStore; // referenced so the wiring point is explicit
  throw new WalletConnectNotConfiguredError();
}
