# TAG IT app — running a dev build on a device

The customer app needs a **native dev build on a physical device** — NFC
(`react-native-nfc-manager`) and the embedded wallet's Keychain/Keystore
(`expo-secure-store`) do **not** work in Expo Go or simulators. This guide gets
the Vault · Tap · Ask flow running end-to-end against the live backend.

## Prerequisites
- Node 20, `pnpm`, and the EAS CLI: `npm i -g eas-cli`
- An Expo account: `eas login`
- A physical iPhone or Android device (NFC for the Tap flow)
- The backend is already live at the Cloud Run URL below — no local server needed

## 1. Environment

Create `tagit-mobile/.env` (values are baked in at build time):

```bash
# Backend (live Cloud Run instance)
EXPO_PUBLIC_API_URL=https://tagit-services-31154571939.us-central1.run.app
EXPO_PUBLIC_API_KEY=<the services API key>

# Optional — faster/keyed Base Sepolia RPC for direct reads (default: public RPC)
EXPO_PUBLIC_BASE_SEPOLIA_RPC=

# Dev/demo only: see the Vault populated against a known holder before you own
# any assets. A fresh embedded wallet owns nothing, so set this to demo.
EXPO_PUBLIC_DEV_OWNER=0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38

# Feature flags (off by default — enable once infra is provisioned)
EXPO_PUBLIC_ENABLE_AA=false
EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

> The `EXPO_PUBLIC_DEV_OWNER` holder above owns ~20 of the 26 seeded
> `TAGITCore` tokens on Base Sepolia — handy for demoing the Vault immediately.
> Remove it for a real user build.

## 2. (For WalletConnect later) deep-link scheme

When you wire WalletConnect, add a scheme to `app.json` under `expo`:

```json
"scheme": "oracular"
```

## 3. Build & run

```bash
cd tagit-mobile

# iOS (needs a Mac + Apple account for device provisioning)
eas build --profile development --platform ios

# Android (simplest — produces an installable APK)
eas build --profile development --platform android

# After it installs on the device, start the dev server and connect:
npx expo start --dev-client
```

The `development` profile in `eas.json` already builds a dev client with
internal distribution.

## 4. What to verify on-device

| Flow | Expected |
|------|----------|
| **Onboarding** | "Create my wallet" → an on-device wallet is generated (key in Keychain/Keystore); the header shows a `0x…` pill |
| **Vault list** | With `EXPO_PUBLIC_DEV_OWNER` set, ~20 asset cards load (state badges, e.g. *Minted*) from `/api/v1/assets` |
| **Asset detail** | Tap a card → lifecycle state, attributes, and a **provenance timeline** (mint event with date) |
| **Tap** | Center button → existing NFC verify flow → Result screen (regression check) |
| **Ask** | From an asset, "Ask about this asset" → chat. *Requires `ANTHROPIC_API_KEY` set in the backend; otherwise returns a clear "not configured" message.* |

## 5. Backend feature flags (server-side env, in tagit-services)

| Feature | Env to set | Without it |
|---------|-----------|-----------|
| Ask (AI chat) | `ANTHROPIC_API_KEY` | `/api/v1/ask` returns 503 `ASK_DISABLED` |
| Email-verified onboarding | `EMAIL_VERIFIER_PRIVATE_KEY` (the on-chain `emailVerifier` wallet, funded) + email provider | `/api/v1/wallet/email/*` returns 503 |
| Gasless deploy | Pimlico bundler URL + `TAGITPaymaster` sponsorship for our selectors | smart-account stays counterfactual (not deployed) |

The Vault, Tap, and asset reads work with **no extra keys** — they're live today.
