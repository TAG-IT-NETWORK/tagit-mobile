/**
 * Mounted UNDER the Wagmi + AppKit providers (only when WalletConnect is
 * configured). Two jobs, no UI:
 *   1. Register the AppKit modal opener so useWallet().connect() can trigger it
 *      from anywhere without calling the useAppKit() hook outside the providers.
 *   2. Mirror the connected external account into the wallet store. Only ever
 *      touches `connected` mode — never wipes an embedded on-device wallet.
 */
import { useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useAppKit } from "@reown/appkit-react-native";
import { useWalletStore } from "./store";
import { registerOpenModal, registerDisconnect } from "./appkit";

export function WalletSyncBridge(): null {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    registerOpenModal(() => open());
    registerDisconnect(() => disconnect());
    return () => {
      registerOpenModal(null);
      registerDisconnect(null);
    };
  }, [open, disconnect]);

  useEffect(() => {
    const store = useWalletStore.getState();
    if (isConnected && address) {
      store.setConnected(address);
    } else if (store.mode === "connected") {
      // External wallet disconnected — reset, but never clobber an embedded one.
      store.disconnect();
    }
  }, [address, isConnected]);

  return null;
}
