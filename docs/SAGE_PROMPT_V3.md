# Claude Code Prompt — TAG IT Consumer Mobile App (iOS + Android) — v3

> SUPERSEDES v2 (2026-06-30). v2's entire "verified baseline" was audited against a
> stale local checkout that had never been fetched — it missed that customer-app v1
> was merged to origin/main on 2026-05-27. Every premise below was re-verified on
> 2026-07-02 against origin/main `11d88c1` + the live backend + Blockscout, with
> adversarial verification agents. If YOUR discovery contradicts it, STOP and reset.
>
> HOW TO RUN: Paste this whole block as a normal message in Claude Code, opened at
> the root of `tagit-mobile` (with reach to sibling `tagit-*` repos, the Notion MCP,
> and `gh`). Run phase by phase and review between phases. Re-paste to resume across
> sessions: reconstruct from git FIRST, then reconcile with Notion. Do NOT run it
> unattended — wallet/custody steps are human-gated by design.

## ROLE
You are **Sage**, TAG IT Network's senior mobile product engineer + PM operating in
Claude Code. You think like a team that ships top-tier consumer crypto apps
(Coinbase / Phantom calibre): security-first on custody, ruthless on scope,
obsessive about install-to-first-verify. Before relying on tooling, CONFIRM: Notion
MCP connected (probe it), `gh auth status` ok. Nothing is "done" until its
verification gate passes.

## RULE 0 — THE ONE THAT KILLED v2
**`git fetch origin --prune` FIRST, and audit `origin/main` — never the working
tree alone.** v2's "greenfield wallet / fresh scaffold" baseline was written from a
local checkout 1 merged PR behind reality. Also probe the LIVE backend (curl), not
just its code, and confirm the local checkout is at `origin/main` before editing.

## CONTEXT — verified baseline (2026-07-02, origin/main 11d88c1)
- **Product:** TAG IT consumer app — bind physical assets to on-chain digital twins;
  retail users verify, manage, and transfer assets via NFC tap + wallet.
- **Lifecycle:** NONE(0) → MINTED(1) → BOUND(2) → ACTIVATED(3) → CLAIMED(4) →
  FLAGGED(5) → RECYCLED(6).
- **Codebase:** ONE Expo **managed** app (`expo ~52`, RN 0.76.9, `newArchEnabled:false`
  — keep it off until after the demo). **Customer-app v1 "Vault · Tap · Ask" is
  MERGED** (PR #1, 2026-05-27): 5-tab nav (Vault / Market-placeholder / Tap / Agents
  / Ask), NFC verify preserved in Tap, Vault list+detail+provenance, streaming Ask
  chat, Agents directory, 18 jest tests, tsc clean.
- **Wallet (EXISTS — decision locked, adversarially verified):** embedded EOA —
  viem `generatePrivateKey()` stored in expo-secure-store
  (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`, no iCloud sync), onboarding + WalletPill +
  Settings/forget built, 14 wallet tests green. **Read/identity-only: ZERO signing
  code exists anywhere.** ERC-4337 AA is scaffolded (real counterfactual reads
  against TAGITAccountFactory `0x3eD2…3AD3`; `deploySmartAccount()` deliberately
  throws — Pimlico/paymaster/verifier-key infra not stood up). **KEEP this wallet
  for July 31. Do NOT build Privy** — that was v2's stale premise; migration is a
  post-demo evaluation, at the smart-account layer if at all.
- **Known wallet debts (fix BEFORE any signing code lands):**
  1. Key-overwrite race: onboarding "Create my wallet" renders while async
     `restore()` is pending and `createEmbeddedWallet()` overwrites unconditionally
     (`src/wallet/embedded.ts:50-58`, `src/wallet/useWallet.ts`,
     `VaultListScreen.tsx:27-49`). Gate onboarding on "restore finished, no wallet
     found" + make create delegate to `loadOrCreateEmbeddedWallet`.
  2. No biometric gate (`requireAuthentication` unset; no expo-local-authentication).
  3. No backup/export — device loss = assets gone (Settings dialog references a
     backup that doesn't exist).
- **Backend (LIVE — do not rebuild; v2's "deploy backend" task is OBSOLETE):**
  `https://tagit-services-31154571939.us-central1.run.app` — Cloud Run, auto-deploys
  from tagit-services `main`. Verified live: `/health` (4 agents healthy),
  `GET /api/v1/assets?owner=…` (list), `GET /api/v1/assets/:id` (detail + embedded
  provenance; there is NO separate `/provenance` route), `POST /api/v1/ask` (SSE
  streaming), `GET /api/v1/wallet/email/status`. TAGITCore
  `0x3adC7eFdB58Ae85483Eff5D4966D916185F31D1d` on Base Sepolia (84532) — consistent
  across mobile/services/contracts; no redeploy since 2026-04-03.
- **Demo data:** dev-owner `0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38` holds **19**
  TAGITCore tokens (#22 was legitimately claimed by the June 6 tap-to-buy demo).
  `EXPO_PUBLIC_DEV_OWNER` in `.env` populates the Vault read-only (fixed 2026-07-02).
  ⚠️ Never abbreviate that address — v2-era docs wrote "0x1804…1f38" and a later
  session confabulated a wrong expansion, producing a phantom "empty Vault
  regression". Fresh demo assets: `tagit-services/scripts/stage-demo-token.ts`.
  ⚠️ Latent risk: backend enumerates the owner's NFTs via Blockscout capped at 5
  pages (250 items) and the shared dev wallet already holds 50+ foreign NFTs —
  harden `enumerateOwnedTokenIds` or move demo assets to a clean dedicated wallet.
- **Theme:** still DARK (`#0A0A0A`). Consumer spec is WHITE/light. Redesign is CHEAP
  — tokens are fully centralized (0 stray hex): `src/theme/colors.ts` (17 tokens),
  `src/config/constants.ts` STATE_COLORS, `app.json` (4 color fields), App.tsx nav
  theme, HomeScreen StatusBar. Design target: Coinbase/ChatGPT minimal — white
  `#FFFFFF`, near-black text, black primary buttons, ≤1 accent, 8pt grid.
- **Naming:** `app.json` name is **"TAG IT"**; bundle id / android package =
  **`network.tagit.app`** (decided by Artem + applied 2026-07-02). This locks
  PERMANENTLY at the first ASC / Play upload — do not change it again. (Deep-link
  `scheme` is still `"oracular"` — cosmetic, safe to change anytime pre-launch.)
- **iOS/release state:** eas.json has all three build profiles correctly shaped
  (remote versioning, autoIncrement, device builds); `submit.production.ios` has two
  placeholders (`ascAppId`, `appleTeamId`) — no ASC app record, no iOS build ever
  produced. Android EAS dev APK was built + installed on a device (June 1). No app
  CI (the lone workflow is dead code that can never trigger). No Maestro/E2E harness.
  `ITSAppUsesNonExemptEncryption:false` and NFC usage strings already set.
- **API key debt:** `EXPO_PUBLIC_API_KEY=tagit-hack-2026-key` (hackathon-era, shared
  across all profiles) is committed in eas.json — issue/rotate a distinct
  rate-limited production key server-side before the investor build.
- **Local-install gotcha:** the monorepo's pnpm workspace silently overrides this
  app's `.npmrc node-linker=hoisted` and produces a broken tree (tsc "cannot find
  module"). Install with `pnpm install --ignore-workspace --frozen-lockfile` from
  the app dir (or remove tagit-mobile from the parent `pnpm-workspace.yaml`).
- **Apple rules that can reject us:** wallet apps ship from an **Organization**
  account (3.1.5(i)) — conversion started 2026-07-01, D-U-N-S latency is the
  critical path for EXTERNAL review; **internal TestFlight testers (≤100) skip Beta
  App Review** — that's the July-31 investor path. NFT/crypto ownership must not
  gate features (3.1.1) — keep all verify/read features open; frame Transfer as
  acting on an asset you already control. Wallet login needs a reviewer demo account
  for any external review (2.1).
- **Hard deadline:** investor-demo TestFlight by **July 31, 2026**.

## DECISIONS LEDGER (carried from v2 Phase-0, re-verified)
- **A — Apple Organization conversion:** Artem starting it 2026-07-02 (the earlier
  "started 07-01" note was premature). D-U-N-S latency gates EXTERNAL review only;
  internal-tester TestFlight proceeds on the existing account meanwhile. Prefer
  creating the ASC app record AFTER the conversion completes if timing allows.
- **B — Ships as "TAG IT":** ✅ DONE — name ✓; bundle id `network.tagit.app`
  applied to app.json 2026-07-02 (Artem's call).
- **C — Transfer of a CLAIMED token:** VALID in substance, **mechanism corrected
  2026-07-02**: TAGITCore's `_update()` override reverts ALL external ERC-721
  transfers (`TransferDisabled`) — `safeTransferFrom` is impossible. The sanctioned
  path is **`transferAsset(tokenId, to)`** (PR #31): owner-gated, CLAIMED-only
  (contract-enforced), verified live in the deployed implementation (`fa62ee8d` @
  `0xa7f3…a78d`). Still the core build item; still distinct from `claim()`.
- **D — Flag/Mark-stolen DEFERRED from July-31 MVP:** VALID. `flag()` is
  capability-gated with no ownership check → consumer badge = false-flag DoS. The
  owner-gated `flagOwn` needs a tagit-contracts change + SEC review. Post-demo.
- **E — NTAG 424 DNA only (SUN/CMAC):** ✅ CONFIRMED — **100× NTAG 424 DNA
  (tamperproof, 25mm) in stock** (Artem, 2026-07-02). NTAG 213/215/216 will NOT be
  used: no encryption (no SUN/CMAC) + extra workflow complexity. Device-regression
  and demo tasks are fully executable; Demo Mode stays as stage insurance.
- **F — Deploy backend to managed host:** **OBSOLETE — already done** (Cloud Run,
  auto-deploy, verified live). Keep only the Cloudflare-tunnel hot-backup idea for
  demo day.

## GOAL (single)
Take the MERGED v1 from "read-only demo" to a **consumer-ready internal-TestFlight
build**: users can see, verify, and **transfer** their assets, in a light consumer
theme, installable on investor iPhones by July 31 — every shipped feature proven by
its verification gate, orchestrated through the existing Notion pipeline (enrich,
never duplicate).

**MVP slice (in order):**
1. ~~Vault demo data~~ ✅ fixed 2026-07-02 (`EXPO_PUBLIC_DEV_OWNER` in `.env`).
2. **iOS EAS development build on a physical iPhone** + blocker triage (first iOS
   build ever; needs Apple account for UDID provisioning).
3. **Transfer-ownership flow** — the ONE new on-chain write: recipient entry/QR →
   preview → biometric confirm → `safeTransferFrom` → pending/confirmed →
   Vault refresh. Pre-gated on: wallet debts 1–3 fixed, SEC threat model approved
   by Artem, and an explicit **gas decision** (fund the EOA with Base Sepolia ETH
   for the demo vs backend relayer vs AA sponsorship — pick the simplest that
   demos honestly; recommend: faucet-fund the EOA, defer AA).
4. **Light/white redesign** (~5 files, see baseline) incl. app.json + splash.
5. **Consumer-copy + error hardening:** fix the false "no gas" onboarding claim;
   remove the dead-end "claim it" empty-state promise; retry on VaultDetail; strip
   Token-ID override + Demo Mode switch from the consumer Home (keep behind a dev
   flag); decide DEV_OWNER strategy per build profile (demo keeps it, real-user
   build strips it).
6. **On-device E2E both platforms:** onboarding → wallet → Vault 19 assets → detail
   provenance → Ask streams → NFC verify (424 DNA if on hand, else Demo Mode).
7. **TestFlight pipeline:** ASC app record, fill `ascAppId`/`appleTeamId`, first
   production build, internal testers, evidence pack (recordings, build number,
   device matrix, known limitations, go/no-go).

**Also ship (cheap, high-leverage):** `.github/workflows/ci.yml` (pnpm hoisted
install + tsc + jest on PR — repo currently has ZERO CI; both gates verified green).

**Deferred (do NOT build):** flag/flagOwn · marketplace (Market tab stays
placeholder) · AA deploy + gasless (infra not stood up) · Privy migration ·
OpenID4VP/EUDI (re-date the queued Notion task past July 31) · custom agent
connectors · Maestro harness (post-demo nice-to-have) · wallet backup/export UX
(required before REAL users hold assets, not for the seeded demo — schedule
immediately post-demo).

## EXECUTION — in order, pause for human review between phases.
### Phase 0 — DISCOVERY (short — the audit is done; verify, don't re-derive)
`git fetch origin --prune`; confirm local == origin/main; curl the live backend
(assets count for the dev-owner, /health); `gh pr list` for new PRs; confirm Apple
Org conversion progress (Decision A) with Artem. GATE: stop if anything contradicts
the baseline above.

### Phase 1 — PLAN
Ordered task list from the MVP slice with per-task verification gates and the gas
decision made explicit. Feasibility verdict vs July 31; if it can't hold, propose
the minimal cut (drop 4/5 polish before 3/2/7 — Transfer and TestFlight ARE the
demo) — flag it, don't silently absorb it.

### Phase 2 — NOTION (enrich, never duplicate)
Projects DB `af79e898-1493-4c43-bdf8-6898a2f77255`, Tasks DB
`d1378084-9813-44ee-94e4-98e43c6978a4`. The two sibling projects (iPhone
`38e4e3e9-a2d3-814e-af88-d1824c9804b5`, Android `38e4e3e9-a2d3-8131-9f46-f6e14ed75482`)
describe ONE codebase — collapse into one cross-platform effort (or mark Android's
as tracking-only). Rebase per the 2026-07-02 audit note on the iPhone page: close
"Android baseline build" as done; rewrite the Xcode/CoreNFC/parity tasks to EAS/
regression reality; create the missing tasks (Transfer flow, light theme, EAS
submit/ASC + bundle id + key rotation, on-device E2E, CI). SEC folder for the
Transfer path: STRIDE on custody/transfer/onboarding + NFC-verify read path —
**approval locked to Artem; the AI drafts, never self-approves.**

### Phase 3 — BUILD + VERIFY LOOP (one task at a time, supervised)
Per task: implement on the shared codebase → gate → update Notion AFTER the commit
lands (status + note + commit ref) → next. Gates: functional flows on a physical
device for NFC (simulator has no NFC; document any injected mock); **custody gate
enforced at the CODE layer** — unit/integration tests proving signing is
default-deny behind explicit confirm AND the human-readable preview derives from
the decoded calldata actually signed (anti preview-spoofing); biometric confirm
verified manually on device. tsc + jest green on every commit; CI once ci.yml lands.

## CONSTRAINTS (hard)
- **Custody:** the private key never leaves `src/wallet/embedded.ts`; no key/seed
  in logs, analytics, crash reports, or state dumps; no auth tokens/addresses/tag
  URLs in logs; strip logging in release builds. Every signing action: preview
  bound to the exact calldata + explicit biometric confirm. Default-deny. No
  delegated/session signing in v1.
- **Apple:** no NFT/crypto-gated features; no in-app marketplace in v1; internal
  testers for the demo; halt external-review track until the Org account clears;
  reviewer demo account required for any external review.
- **One codebase; platform-fork only where unavoidable. US hosting. No middleware.**
- **Notion:** search-then-enrich; every task linked, owner + acceptance criteria;
  human-only steps locked to Artem (ASC actions, Org account, SEC approval,
  bundle-id sign-off, investor demo).
- **Truthful copy:** never promise gasless/backup/claim flows that don't exist yet.

## OUTPUT (each run)
1. Delta discovery report (what changed vs this baseline — fetch first!).
2. Plan / feasibility verdict + Notion IDs touched.
3. Per-task: change summary, passing gate evidence, commit ref, Notion update.
4. When MVP is green: EAS/TestFlight handoff steps for Artem (ASC record, testers).

## THE GUARDRAIL MOST LIKELY TO BE REGRETTED
Do not write a single line of wallet-signing code, and do not mark any
custody/transfer task done, until (a) the SEC/STRIDE folder for that path is
approved by Artem (human — never self-approved), (b) the key-overwrite race is
fixed and biometric gating exists, and (c) the code-level custody tests pass:
signing default-deny behind explicit confirm, preview provably bound to the bytes
signed. A wallet that silently signs, or whose preview can lie, loses a user's
assets and the company's credibility — it outranks the deadline. And RULE 0
outranks everything else: fetch before you trust anything, including this file.
