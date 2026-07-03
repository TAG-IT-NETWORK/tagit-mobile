# SEC — STRIDE Threat Model: Transfer / Custody Path (v2)

> Draft by Sage 2026-07-02, **red-teamed same day** (3 adversarial reviews: custody
> attack, Apple compliance, feasibility — all fixes incorporated; v1 claims that were
> refuted have been corrected, marked ⚠️REVISED).
> **Status: AWAITING HUMAN APPROVAL (Artem).** No wallet-signing code until approved.

## Scope — corrected on-chain mechanism (⚠️REVISED)
The ONE on-chain write in v1 is **`TAGITCore.transferAsset(tokenId, to)`** — NOT
`safeTransferFrom`. Verified against source AND deployed bytecode (2026-07-02):
- `_update()` override reverts `TransferDisabled()` for ALL external ERC-721
  transfers — `safeTransferFrom` by the owner would revert on-chain.
- `transferAsset` (PR #31) is the only sanctioned consumer-to-consumer path:
  **owner-gated** (`msg.sender == asset.owner`), **CLAIMED-state-only** (FLAGGED /
  non-CLAIMED tokens revert — lifecycle enforcement is CONTRACT-level, not client),
  zero/self-recipient reverts, CEI + ReentrancyGuard, emits `AssetResold` +
  `CustodyTransfer` + standard `Transfer` (so existing provenance keeps working
  with no backend change — verified in tagit-services assets.ts).
- Selector `0xfa62ee8d` confirmed present in the deployed implementation
  `0xa7f34fd5…a78d` behind proxy `0x3adC…D1d` on Base Sepolia (84532).
- Mobile ABI (`src/onchain/abis/TAGITCore.ts`) does NOT yet include
  `transferAsset`/`AssetResold` — must be added; `getAsset` field order
  (owner,timestamp,state,flags,…) is load-bearing for the state preflight — add a
  decode test against a known token.

## Assets to protect
1. **The private key** (embedded EOA, expo-secure-store) — compromise = total loss.
2. **The asset NFT** — a wrong/spoofed transfer is irreversible.
3. **User trust** — a consent screen that lies about what is signed is fatal.

## Honest security posture (⚠️REVISED — read before the table)
A React-Native EOA wallet has ONE JS runtime (Hermes): module privacy is
encapsulation-by-convention, **not** a security boundary. Same-process malicious code
(a compromised dependency) can bypass any JS-layer control, including everything
below except OS-enforced key access control. Therefore:
- **Against same-process malicious code** the real defenses are: frozen lockfile +
  CI, minimal dependency surface, and (the durable fix, post-v1) moving signing off
  the JS heap — native signer or the AA path where the owner key stays cold.
- **The confirmToken scheme (below) is a SELF-CONSISTENCY control**: it prevents
  accidental preview-vs-signed drift and TOCTOU bugs in first-party code. It is NOT
  claimed to stop an in-process attacker.
- **OS-enforced biometric key access is the only control that survives a hostile
  runtime** — an attacker who calls the key accessor still triggers the OS prompt.

## Signing-path architecture (proposed, revised)
```
TransferScreen — recipient entry: PASTE-first (QR optional, needs expo-camera +
  NSCameraUsageDescription; descope if schedule slips). Checksum = typo detection
  ONLY (a valid attacker address passes it — never claimed as a spoofing control).
   └─> buildTransfer(tokenId, to)                      [src/wallet/transfer.ts]
         ├─ calldata = encodeFunctionData(transferAsset(tokenId, to))
         ├─ PREFLIGHT (reads, advisory UX; the CONTRACT is the enforcement layer):
         │   chainId==84532 · getAsset(tokenId).owner==activeAddress ·
         │   state==CLAIMED · to∉{self,zero} · estimateGas simulation (a revert
         │   here surfaces TransferDisabled/InvalidState/NotAssetOwner pre-sign) ·
         │   balance covers gas
         └─> ConfirmScreen
               ├─ AUTHORITATIVE consent surface (derived from decodeFunctionData
               │   of the exact calldata): tokenId + FULL 40-char recipient
               │   (grouped, monospaced — NEVER shortenAddress; the app's 0x12…ab
               │   house style is banned on this screen: 4+4-hex vanity collisions
               │   are GPU-feasible) + target contract + chain + gas estimate
               ├─ ADVISORY context, visually labeled "metadata — not verified on
               │   this screen": asset name/image (they come from the backend
               │   keyed by tokenId and CANNOT be bound to calldata) (⚠️REVISED:
               │   v1 claimed the whole preview derived from calldata — false)
               ├─ first-time-recipient warning (address-poisoning mitigation)
               ├─ OS-level biometric: the key itself is stored with SecureStore
               │   requireAuthentication:true → Keychain access control (iOS) /
               │   BiometricPrompt+Keystore (Android) fires AT KEY RETRIEVAL
               │   (⚠️REVISED: v1's expo-local-authentication JS prompt alone is
               │   theater — a boolean any in-process attacker can patch)
               └─ issues single-use confirmToken binding the FULL canonical tx:
                   keccak(to_contract ‖ value ‖ data ‖ chainId ‖ nonce ‖ fees)
                   (⚠️REVISED: v1 bound only hash(data) — left tx.to/value/chain
                   unbound; no expiry — single-use only, a 60s timer stops no
                   attacker and punishes careful readers)
                     └─> signer.signAndSend(tx, confirmToken) [src/wallet/signer.ts]
                           ├─ DEFAULT-DENY: recomputes the canonical hash over the
                           │   exact object it signs; throws on mismatch/reuse/absence
                           ├─ the ONLY importer of the raw-key accessor
                           └─ broadcast → waitForTransactionReceipt(60s) →
                               "pending, check later" state → history entry
```
**Key-boundary refactor (required):** today `loadEmbeddedWallet()` returns
`{address, privateKey}` into the hook layer (useWallet). Split: public API returns
**address-only**; a signer-internal accessor returns the key and is import-fenced by
a CI grep-gate **on the accessor's import sites** (not the string "privateKey").

## STRIDE analysis (revised)
| Threat | Vector | Mitigation | Verified by |
|---|---|---|---|
| **S**poofing | Clipboard malware / QR swap substitutes recipient | FULL-address display + forced review + first-time-recipient warning; checksum catches typos only | Manual paste/QR swap test; UI review |
| | Vanity-address poisoning (matching 4+4 hex) | Never truncate on Confirm; poisoning warning if resembles a prior counterparty | Unit test: Confirm renders 40 chars |
| | Deep link opens Transfer with attacker-filled fields | No linking route to Transfer/Confirm; **CI route-audit fails the build** if one appears; Confirm-from-calldata is the backstop | CI assertion + route audit |
| **T**ampering | Preview-vs-signed drift (first-party bug/TOCTOU) | confirmToken binds full canonical tx hash; signer recomputes + default-denies | **Custody unit tests (the gate)** |
| | Backend lies about asset name/image for tokenId | Advisory-metadata labeling; authoritative surface is tokenId+recipient from calldata; estimateGas simulation surfaces on-chain reverts | UI copy review; simulation test |
| | Same-process malicious dependency | Frozen lockfile + CI; minimal new deps (expo-local-authentication, expo-camera only); OS biometric at key retrieval still fires; durable fix = off-heap signing (post-v1, AA path) | Lockfile diff review; dep count in PR |
| | RPC MITM / wrong chain | HTTPS RPC; EIP-155 chainId inside the signed tx; preflight asserts 84532 | Unit test on tx params |
| **R**epudiation | "I never sent that" | tx hash in local history (new store — in Transfer task DoD); `AssetResold` + `CustodyTransfer` + `Transfer` events on-chain; provenance timeline renders it (no backend change needed — verified) | E2E: provenance shows the transfer |
| **I**nfo disclosure | Key/payload in logs, errors, crash reports | Key confined to signer accessor; sanitized errors; no analytics SDKs; strip console in release (babel transform-remove-console — in task #11) | CI grep-gate; release-build log audit |
| | Screen capture of Confirm | FLAG_SECURE on Confirm (Android); iOS screenshot detection not attempted (accepted) | Manual check |
| | Backup exfiltration | iOS `WHEN_UNLOCKED_THIS_DEVICE_ONLY` + `requireAuthentication` (no iCloud sync); Android Keystore-bound, undecryptable off-device | Config review |
| **D**oS | RPC down / rate-limited | Retry with backoff on reads; failed broadcast never left the device — safe to retry | Error-path tests; airplane-mode manual |
| | Stuck pending | viem EIP-1559 estimation; 60s receipt timeout → non-blocking "pending" state | Manual slow-network test |
| **E**levation | Non-wallet code reaches the key | Address-only public API + accessor import-fence in CI; OS prompt fires even if bypassed | CI grep-gate |
| | Transfer of non-CLAIMED / non-owned / FLAGGED token | **CONTRACT-ENFORCED** (verified on deployed bytecode): `transferAsset` reverts unless owner + CLAIMED; `_update` blocks all direct ERC-721 transfers; client preflight is UX only | On-chain revert test vs deployed contract |
| | Approval-based drains | Zero `approve`/`setApprovalForAll` code paths in v1 | Code review; grep |

## Hard preconditions (blocking; = wallet-hardening task `3914…9087`, revised scope)
1. **Key-overwrite race fixed** (onboarding can destroy an existing key today).
2. **OS-enforced key access**: re-store the key with `requireAuthentication: true`
   (one-time migration of the existing item; device support detected via
   `SecureStore.canUseBiometricAuthentication()`). `NSFaceIDUsageDescription` is
   injected via expo-secure-store's own `faceIDPermission` plugin option — no
   extra native dependency (`expo-local-authentication` stays out of v1: OS-level
   gating comes from SecureStore itself, and a JS-layer prompt adds no security).
   Must be in app.json **before the first iOS dev build** for device verification.
3. `restore()` failure → retry path, never a create path that can overwrite.
4. Key-boundary refactor (address-only public API) + CI accessor grep-gate.
5. Mobile ABI: add `transferAsset` + `AssetResold`; decode-test `getAsset` field order.

## Explicitly forbidden in v1
Session signers / delegated signing · approvals · `signMessage`/typed-data surface ·
transfer via deep link · mainnet config · truncated addresses on the Confirm screen.

## Residual risks (accepted for the July-31 TESTNET demo — revisit before real users)
1. **No key backup/export** — device loss = asset loss. Testnet-only acceptance;
   hard blocker before real assets (post-demo, ROADMAP C; AA email-recovery path).
1b. **Biometric re-enrollment invalidates the gated key** (iOS `biometryCurrentSet`,
   Android `invalidatedByBiometricEnrollment` — both hardcoded in expo-secure-store;
   no "biometryAny" option). Adding a fingerprint / re-enrolling Face ID kills the
   key; it then READS AS NULL while the ungated address survives. Detected and
   surfaced distinctly (`KeyInvalidatedError`, never "no wallet"). Same acceptance
   and same fix path as risk 1: backup/export or AA owner-rotation MUST land
   before real assets — explicitly BEFORE auth-gating runs on real users' keys.
1c. **Ungated-key populations**: legacy pre-hardening keys are NOT retroactively
   auth-gated (a silent launch-time migration prompts users without context and
   can lock out old binaries — rejected by review); devices without class-3
   biometrics, and users who cancel the creation prompt, also store ungated. On
   these, the import fence + module privacy are the only key-access layers.
   Dev/testnet population today; acceptable. Note: the gated-write path requires
   the NSFaceIDUsageDescription plist (expo-secure-store `faceIDPermission`) in
   the BUILT binary — this JS is coupled to a native rebuild, never OTA it onto
   older binaries.
2. Same-process malicious dependency can bypass all JS-layer controls (see posture);
   OS biometric at key retrieval is the surviving control. Durable fix post-v1.
3. Unlocked-phone attacker within a biometric session — standard mobile-wallet posture.
4. JS-heap key exposure during signing (strings can't be zeroized) — inherent to RN
   EOA wallets; minimized key-touch; AA migration reduces later.
5. RPC trusted for preflight reads (UX only — contract enforces; signed payload
   integrity independent of RPC).

## Verification gate (must pass before the Transfer task closes)
- [ ] Unit: signer default-denies without / with reused / with foreign confirmToken
- [ ] Unit: signer refuses when canonical-tx hash ≠ token hash (each field varied:
      to, value, data, chainId, nonce, fees)
- [ ] Unit: Confirm's authoritative fields derived from decoded calldata
      (property-based across random tokenId/address); full 40-char render asserted
- [ ] Unit: preflight rejects wrong chain, non-owner, zero/self, non-CLAIMED
- [ ] On-chain (Base Sepolia, deployed contract): happy-path `transferAsset` +
      revert tests (non-owner, FLAGGED via a staged token if available)
- [ ] Manual on-device: OS biometric fires at key retrieval for EVERY signature;
      airplane-mode; wrong-recipient; FLAG_SECURE on Confirm
- [ ] CI: accessor import-fence green; deep-link route-audit green
- [ ] E2E: provenance timeline shows the transfer after confirmation

## Approval
- [x] **APPROVED — Artem** (date: 2026-07-03, recorded in session + Notion task
      `3914…7fc2`)  /  [ ] CHANGES REQUESTED: ______________
