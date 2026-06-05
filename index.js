// Crypto/encoding polyfills (react-native-get-random-values, fast-text-encoding)
// MUST exist before WalletConnect's compat shim and viem touch crypto — load them
// FIRST, then the WC compat shim. (Compat-before-polyfills crashed Hermes on launch
// because crypto.getRandomValues wasn't installed yet.)
import "./src/onchain/polyfills";
import "@walletconnect/react-native-compat";

import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
