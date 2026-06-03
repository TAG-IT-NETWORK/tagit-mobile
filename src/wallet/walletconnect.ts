/**
 * WalletConnect (bring-your-own wallet) public seam. The AppKit/Wagmi setup
 * lives in ./appkit; this preserves the import surface that useWallet and
 * OnboardingScreen already use (connectExternalWallet, WALLETCONNECT_AVAILABLE).
 */
import { WALLETCONNECT_AVAILABLE, openConnectModal } from "./appkit";

export { WALLETCONNECT_AVAILABLE };

export class WalletConnectNotConfiguredError extends Error {
  constructor() {
    super(
      "WalletConnect isn't configured. Set EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID " +
        "(free at dashboard.reown.com) in .env and the eas.json build profiles.",
    );
    this.name = "WalletConnectNotConfiguredError";
  }
}

/**
 * Open the WalletConnect modal so the user can pick an external wallet. Resolves
 * once the modal is shown; the connected address is captured by WalletSyncBridge
 * (via wagmi's useAccount) and written to the wallet store.
 */
export async function connectExternalWallet(): Promise<void> {
  if (!WALLETCONNECT_AVAILABLE) throw new WalletConnectNotConfiguredError();
  await openConnectModal();
}
