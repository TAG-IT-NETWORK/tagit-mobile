// WalletConnect/AppKit shims MUST load before everything (crypto.getRandomValues,
// BigInt, TextEncoder) — even before our viem polyfills, or you get opaque errors.
import "@walletconnect/react-native-compat";
// App entry. Polyfills MUST load before anything that touches viem/wallet libs.
import "./src/onchain/polyfills";

import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
