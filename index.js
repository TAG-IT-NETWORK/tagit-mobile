// App entry. Polyfills MUST load before anything that touches viem/wallet libs.
import "./src/onchain/polyfills";

import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
