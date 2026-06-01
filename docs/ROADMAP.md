# TAG IT customer app — roadmap & next steps

Status of the iOS/Android customer app (wallet + NFC+NFT asset management).
v1 = **Vault · Tap · Ask** on Base Sepolia (84532). Marketplace + Agent Hub are
later phases. See `DEV_BUILD.md` to run it; the build plan that produced v1 is at
`~/.claude/plans/wild-spinning-hopcroft.md`.

**Currently live (2026-06-01):**
- Backend: `https://tagit-services-31154571939.us-central1.run.app` (Cloud Run, auto-deploy on `main` merges via Cloud Build)
- App: `feat/customer-app-v1` on `TAG-IT-NETWORK/tagit-mobile` — installed as ORACULAR dev build on Android, currently connecting Metro

PRs: app `tagit-mobile#1` (open) · backend `tagit-services#9` ✅ merged · backend hotfix `tagit-services#10` ✅ merged.

---

## ✅ Shipped & verified

### v1 foundation
- [x] App foundation: `onchain/` viem module, polyfills (`index.js`), Zustand, pnpm-monorepo `metro.config.js`
- [x] 5-tab nav (Vault · Market · Tap · Agents · Ask); NFC verify flow preserved in Tap tab
- [x] Embedded EOA wallet (`expo-secure-store`) + onboarding
- [x] Vault list + detail + provenance timeline (wired to live backend)
- [x] Ask chat UI + backend `POST /api/v1/ask` (streaming, asset-grounded)
- [x] Email-verifier backend + AA counterfactual-address read
- [x] 18 unit tests, tsc clean, Metro bundle builds (iOS + Android)

### Backend live on Cloud Run
- [x] `GET /api/v1/assets[/:tokenId]` — 20 assets returned for the dev-owner address, 9-event provenance for token #1
- [x] **Lifecycle events in provenance** (StateChanged + TagBound via Blockscout contract-logs API — no keyed RPC needed)
- [x] `POST /api/v1/ask` — streaming Anthropic responses; `ANTHROPIC_API_KEY` bound from **GCP Secret Manager** (secret `App_Claude_agent`)
- [x] `POST /api/v1/wallet/email/{start,verify}` + `GET /status` — `isEmailVerified` read verified live (verify path gated until `EMAIL_VERIFIER_PRIVATE_KEY` is set)
- [x] **Cloud Build auto-deploy from `main`** — `Connect to repo` wired; future PR merges auto-build & deploy
- [x] Dockerfile husky bug fixed (PR #10) — `--ignore-scripts` in runtime stage

### Mobile dev build
- [x] EAS `development` profile Android APK built successfully on EAS servers
- [x] APK installed on Android device — **ORACULAR dev launcher running**
- [x] All EAS pre-flight blockers resolved: monorepo `package.json`, `expo-dev-client`, Expo 52 version pins, `react-native-directory` exclusions, `.npmrc node-linker=hoisted` for pnpm autolinking, fresh standalone `pnpm-lock.yaml`

---

## 🔄 In progress (right now)
- [ ] **Connect Metro dev server to the phone** — laptop running `npx expo start --dev-client` on `192.168.1.91:8081`; phone needs manual URL entry on the dev launcher
- [ ] First on-device E2E pass: onboarding → wallet pill → Vault populates (20 assets) → asset detail (9-event timeline) → Ask streams → NFC scan regression check

---

## 🔭 Next steps

### A. Credential-blocked finishers (code is wired; just needs keys)
- [ ] **WalletConnect**: get a free Reown `projectId`; then resolve the RN-version issue
      (`@reown/appkit-wagmi-react-native` → `porto` needs RN ≥0.81, app is on 0.76.9 — bump RN
      or wait for AppKit to drop the hard peer), install, and wire `connectExternalWallet()`
      in `src/wallet/walletconnect.ts`.
- [ ] **Gasless ERC-4337 deploy** (the big one — 3 independent pieces):
  - [ ] Stand up a **Pimlico** Base Sepolia v0.7 bundler (API key)
  - [ ] Configure **TAGITPaymaster** sponsorship for the function selectors v1 uses + fund the brand deposit
  - [ ] Fund the on-chain **`emailVerifier`** wallet and set `EMAIL_VERIFIER_PRIVATE_KEY` in tagit-services
  - [ ] Implement the `createAccountWithOwner` sponsored UserOp in `src/wallet/aa.ts` `deploySmartAccount()`
        (behind `EXPO_PUBLIC_ENABLE_AA`), then add the email→verify→deploy flow to onboarding

### B. Ship / ops follow-ups
- [ ] Once on-device E2E passes, remove `EXPO_PUBLIC_DEV_OWNER` for a real user build profile (the seeded-Vault demo override)
- [ ] Add app CI: `.github/workflows/ci.yml` (typecheck + jest) on every PR
- [ ] Add EAS auto-build workflow on merges to `main`
- [ ] iOS dev build (needs Apple Developer account for UDID provisioning)
- [ ] Merge `tagit-mobile#1` once on-device pass is green

### C. Polish (v1.x)
- [ ] "Report stolen" / recovery action on asset detail (wire `TAGITRecovery` + Recovery Resolver agent)
- [ ] Pull-to-refresh + caching on the Vault; skeleton loaders
- [ ] Wallet backup/export affordance (embedded EOA has no recovery if device lost)
- [ ] TAG IT branding pass (logo, splash, app icon) to match the dashboard
- [ ] Suppress the harmless web bundling warning (or actually wire `react-native-web` if we ever want a web target)

### D. Phase 2 — Verified-trade Marketplace (the moat)
- [ ] `Market` tab: browse physically-verified, agent-attested listings
- [ ] List / buy with `OfferEscrow` + `VerificationEscrow`; tap-on-delivery settlement
- [ ] "Verified Trade" gate badge (physical tap + on-chain twin + escrow + ERC-8004 attestation)

### E. Phase 3 — Agent Hub (ERC-8004 + x402)
- [ ] `Agents` tab: browse/deploy agents (Pricing, Listing, Authenticator, Recovery Resolver…)
- [ ] On-chain reputation scores (indexer) + x402 pay-per-task
- [ ] Scoped delegation via CapabilityBadge / smart-account session keys; human-on-the-loop guardrails

---

## Known constraints
- A fresh embedded wallet owns nothing → use `EXPO_PUBLIC_DEV_OWNER` to demo the Vault populated against a known holder (`0x1804…1f38`).
- NFC + Keychain require a native EAS build (not Expo Go / simulator).
- Public Base Sepolia RPC caps `eth_getLogs` at 2000 blocks → we use Blockscout for provenance (works around the cap; the contract-logs endpoint isn't rate-limited the same way).
- `pnpm` symlinked `node_modules` breaks Expo autolinking on EAS — pinned via `.npmrc node-linker=hoisted` (scoped to this app, the rest of the monorepo is unchanged).
