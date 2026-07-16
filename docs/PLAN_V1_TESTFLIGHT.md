# Plan — Consumer App v1 → Investor TestFlight (July 31, 2026) — v2

> Sage v3 Phase-1 output, 2026-07-02, **red-teamed same day** (custody / Apple /
> feasibility lenses; all fixes incorporated). Baseline: `docs/SAGE_PROMPT_V3.md`
> (origin/main). Notion: 🍎 project `38e4e3e9-a2d3-814e-af88-d1824c9804b5`, tasks
> rebased 2026-07-02. Pauses for Artem's sign-off; SEC model
> (`docs/SEC_TRANSFER_STRIDE.md`) needs his explicit approval before signing code.

## Goal
From read-only v1 to a consumer-ready **internal TestFlight** build: users see,
verify, and **transfer** their assets, light consumer theme, investor iPhones, July 31.

## ⚠️ Corrected mechanism (found in red-team verification)
Direct ERC-721 transfers are **disabled** in TAGITCore (`_update` override reverts
`TransferDisabled`). The transfer feature uses **`transferAsset(tokenId, to)`** —
owner-gated, CLAIMED-only, verified live in the deployed implementation
(selector `fa62ee8d` @ `0xa7f3…a78d` behind the proxy). Decision C is updated
accordingly. Bonus: lifecycle enforcement (no moving FLAGGED assets) is
contract-level; and the emitted `Transfer`/`AssetResold` events flow into the
existing provenance timeline with **zero backend work** (verified).

## Demo integrity (corrected)
- `EXPO_PUBLIC_DEV_OWNER` is **already absent from every eas.json profile** — it
  lives only in gitignored `.env` read by local Metro. The investor build needs no
  change; add a #12 verification step (grep the exported bundle for
  `EXPO_PUBLIC_DEV_OWNER`) and never commit `.env`.
- The demo iPhone is onboarded normally (embedded wallet), then **seeded**: extend
  `tagit-services/scripts/stage-demo-token.ts` with a `--buyer=0x…` flag (the
  relayer's `settleSale(tokenId, buyer)` already accepts an arbitrary buyer —
  verified; ~1h work). Preconditions: `SALE_REQUIRE_PAYMENT` not enforced on the
  live deployment, `GET /api/v1/sale/status` shows relayer gas + CLAIMER capability.
  Faucet-fund the device EOA for transfer gas.
- Investors installing on their own iPhones see an **empty vault** (per-device
  wallets) — the demo is presented from the seeded device; their install shows
  Tap-verify + Ask, which work wallet-free.
- Transfer UI is hidden whenever DEV_OWNER is set (dev builds show someone else's
  assets; preflight would reject anyway).

## Ordered work packages
| # | Work | Notion task | Owner | Target |
|---|------|-------------|-------|--------|
| 0 | ✅ Vault demo data, repo sync, dep triage | — | Sage | done 07-02 |
| 1 | ✅ CI: typecheck + jest on PR/main (first run green) | `3914…e405` | SUDO | done 07-02 |
| 2 | SEC threat-model approval (v2, red-teamed) | `3914…7fc2` | **Artem** | 07-07 |
| 3 | Wallet hardening — **starts NOW, not gated on #2** (pre-signing work): overwrite race; OS-enforced `requireAuthentication:true` key storage (+ one-time re-store migration); restore-retry; key-boundary refactor (address-only API); **add native deps** expo-local-authentication (+ expo-camera if QR survives scope) + NSFaceID/NSCamera strings BEFORE #4's build | `3914…9087` | SUDO | 07-08 |
| 4 | iOS EAS **development** build on physical iPhone + triage. Checklist: confirm EAS enabled NFC Tag Reading on the App ID; pre-add ISO7816 AIDs (`D2760000850100/01`) to nfc-manager `selectIdentifiers` (free insurance); dedupe the two NFC usage strings | `632f…f560` | **Artem**+SUDO | 07-08 |
| 4b | **Create ASC app record NOW on the existing Individual account** (conversion preserves Team ID/apps/certs/TestFlight — waiting gains nothing). Name fallback if "TAG IT" taken: "TAG IT Network" (device name stays TAG IT). Start investor ASC user invites (see #12) | `3914…9867` (pulled fwd) | **Artem** | 07-10 |
| 5 | Android on-device NFC verify regression (NTAG 424 DNA) | `38e4…3f35` | SUDO+Artem | 07-11 |
| 6 | Light-theme redesign (~5 token files) | `3914…65a6` | SUDO | 07-14 |
| 7 | Android full E2E pass (preview APK, umbrella flow) | `38e4…8199` | SUDO+Artem | 07-15 |
| 8 | **Transfer flow** (`transferAsset`; custody-gated): code-complete ~07-13, custody review + on-device verify 07-14→17. DoD includes: ABI fragments (`transferAsset`, `AssetResold`) + `getAsset` decode test; CI accessor grep-gate + deep-link route-audit; local tx-history entry; paste-first recipient entry (QR only if #3 shipped camera) | `3914…184e` | SUDO | 07-17 |
| 9 | iOS on-device NFC verify regression (424 DNA) | `38e4…a7e1` | Artem+SUDO | 07-18 |
| 10 | EAS submit completion: fill ascAppId/appleTeamId (record exists from #4b); ~~API-key rotation with sequencing~~ ✅ DONE 2026-07-16 — old hackathon key retired; new key in EAS env vars (sensitive, all 3 environments) + Cloud Run; old key stays valid only until builds #11 land on both platforms | `3914…9867` | **Artem**+SUDO | 07-21 |
| 11 | Error-state hardening + copy fixes + strip-console-in-release (babel transform) | `38e4…42e3` | SUDO | 07-22 |
| 12 | TestFlight production build + internal testers. Mechanics: investors must be **ASC users** (invite via Users & Access, Marketing role = least privilege; **Individual account caps at 50 users** until Org completes; invites out by 07-21, acceptances chased before 07-24) → "Investors" internal group → build available minutes after processing, **no Beta App Review**. Verify bundle contains no `EXPO_PUBLIC_DEV_OWNER` | `38e4…9484` | **Artem**+SUDO | 07-24 |
| 12b | **Demo device provisioning**: onboard investor build on demo iPhone; add tap-to-copy address (WalletPill/Settings — small code task, in #8 scope); faucet-fund; `stage-demo-token --buyer=<device>` ×3; verify Vault; one rehearsal transfer | new (fold into `38e4…9484` notes) | **Artem**+SUDO | 07-25 |
| 13 | Evidence pack + go/no-go | `38e4…4304` | SUDO→Artem | 07-29 |
| — | Buffer / dry-run / re-cuts | | | 07-29→31 |

Parallelism: #3 immediate; #4∥#4b∥#5 in week 1; #6∥#7 during #8's review window
(#8 code-complete ~07-13); #9–#12 serialize on Apple artifacts from #4b.

## Critical path (corrected by red-team)
**ASC app record (#4b, NOW) → first iOS build (#4) → TestFlight (#12).**
Individual→Org conversion runs in parallel and endangers nothing (in-place
conversion keeps Team ID, apps, certs, TestFlight builds; only the seller name
changes). Risk: Apple may temporarily lock publishing/portal actions **while
conversion processes** — if a lock hits during #4b/#10/#12, contact Developer
Support with the deadline; worst case the demo ships under the individual seller
name (cosmetic). A paid Individual account already supports iPhone UDID dev builds
(100/yr) and NFC entitlements — nothing blocks week 1.

## Gas decision (for SEC review)
Faucet-fund the demo device's embedded EOA with Base Sepolia ETH (testnet, no real
value). AA/paymaster gasless deferred — infra absent, honest demo doesn't need it.
Onboarding copy stops claiming "no gas" until AA ships (#11).

## Feasibility verdict
**Plausible with ~2 days buffer** given: SEC approval by 07-07, Apple account can
provision a dev build in week 1 (verified: Individual account suffices), Transfer
stays paste-recipient + single-asset. Minimal cut if slipping: drop #11 depth and
#5/#7 negative-matrix breadth; drop QR (paste-only); **never** drop #8 or #12 —
they ARE the demo. Deferred entirely: flag/flagOwn, marketplace, AA/gasless, Privy,
EUDI, Maestro, wallet backup/export (post-demo blocker before real users).

## External-review readiness (post-demo, NOT July-31 scope)
Before ANY external tester / App Store submission: Org conversion complete
(3.1.5(i) — no testnet carve-out); hide or populate the Market placeholder tab
(2.1); reviewer instructions = seeded-wallet notes + NFC-tap demo video + Demo Mode
behind a documented flag (no login exists, so instructions replace a demo account).

## Standing risks
1. **No wallet backup/export** — testnet-only acceptance; schedule immediately
   post-demo before any real asset.
2. Backend's 5-page Blockscout window on a dirty shared wallet — moot for the demo
   (clean seeded device wallet); tagit-services hardening stays a follow-up.
3. First iOS build surprises (NFC plugin, secure-store, new native deps) — why #3's
   dep additions land BEFORE #4, and #4 runs week 1. Budget one extra dev-client
   build cycle mid-week-2 if a native dep arrives late.
4. Committed hackathon API key — rotated with sequencing in #10.
