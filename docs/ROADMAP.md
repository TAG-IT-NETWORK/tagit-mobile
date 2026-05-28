# TAG IT customer app — roadmap & next steps

Status of the iOS/Android customer app (wallet + NFC+NFT asset management).
v1 = **Vault · Tap · Ask** on Base Sepolia (84532). Marketplace + Agent Hub are
later phases. See `DEV_BUILD.md` to run it; the build plan that produced v1 is at
`~/.claude/plans/wild-spinning-hopcroft.md`.

PRs: app `TAG-IT-NETWORK/tagit-mobile#1` · backend `TAG-IT-NETWORK/tagit-services#9`.

---

## ✅ Done & verified (v1 foundation)
- [x] App foundation: `onchain/` viem module, polyfills (`index.js`), Zustand, pnpm-monorepo `metro.config.js`
- [x] 5-tab nav (Vault · Market · Tap · Agents · Ask); NFC verify flow preserved in Tap tab
- [x] Backend `GET /api/v1/assets[/:tokenId]` — live on Base Sepolia (enumerate + multicall + provenance)
- [x] Embedded EOA wallet (`expo-secure-store`) + onboarding
- [x] Vault list + detail + provenance timeline (wired to live backend)
- [x] Ask chat UI + backend `POST /api/v1/ask` (streaming, asset-grounded)
- [x] Email-verifier backend + AA counterfactual-address read
- [x] 18 unit tests, tsc clean, iOS Metro bundle builds

---

## 🔭 Next steps

### A. Credential-blocked finishers (code is wired; just needs keys)
- [ ] **Ask → live**: set `ANTHROPIC_API_KEY` in tagit-services env. No code change. *(owner: Artem)*
- [ ] **WalletConnect**: get a free Reown `projectId`; then resolve the RN-version issue
      (`@reown/appkit-wagmi-react-native` → `porto` needs RN ≥0.81, app is on 0.76.6 — bump RN
      or wait for AppKit to drop the hard peer), install, and wire `connectExternalWallet()`
      in `src/wallet/walletconnect.ts`.
- [ ] **Gasless ERC-4337 deploy** (the big one — 3 independent pieces):
  - [ ] Stand up a **Pimlico** Base Sepolia v0.7 bundler (API key)
  - [ ] Configure **TAGITPaymaster** sponsorship for the function selectors v1 uses + fund the brand deposit
  - [ ] Fund the on-chain **`emailVerifier`** wallet and set `EMAIL_VERIFIER_PRIVATE_KEY` in tagit-services
  - [ ] Implement the `createAccountWithOwner` sponsored UserOp in `src/wallet/aa.ts` `deploySmartAccount()`
        (behind `EXPO_PUBLIC_ENABLE_AA`), then add the email→verify→deploy flow to onboarding

### B. Ship / ops
- [ ] Deploy updated **tagit-services** to Cloud Run so `/assets` + `/ask` are live for device builds
- [ ] **EAS dev build** on a physical device; run the `DEV_BUILD.md` checklist (NFC + Keychain)
- [ ] Point the app's `EXPO_PUBLIC_API_URL` at the deployed services; remove `EXPO_PUBLIC_DEV_OWNER` for prod
- [ ] Add app CI (typecheck + jest) and an EAS build workflow

### C. Polish (v1.x)
- [ ] "Report stolen" / recovery action on asset detail (wire `TAGITRecovery` + Recovery Resolver agent)
- [ ] Pull-to-refresh + caching on the Vault; skeleton loaders
- [ ] Surface lifecycle events (StateChanged/TagBound) in provenance via a keyed/archive RPC or indexer
- [ ] Wallet backup/export affordance (embedded EOA has no recovery if device lost)
- [ ] TAG IT branding pass (logo, splash, app icon) to match the dashboard

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
- Public Base Sepolia RPC caps `eth_getLogs` at 2000 blocks → provenance uses Blockscout transfers
  (mint + transfers only; lifecycle events need a keyed RPC/indexer).
- A fresh embedded wallet owns nothing → use `EXPO_PUBLIC_DEV_OWNER` to demo the Vault.
- NFC + Keychain require a native EAS build (not Expo Go / simulator).
