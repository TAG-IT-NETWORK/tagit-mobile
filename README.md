# app-mobile-scanner
Mobile scanner app for scanning tags and verifying credentials.

## Vault actions (owner)

The on-chain owner of an asset can manage it from the asset page: **Report lost or
stolen**, **List for sale** / **Remove from sale**, **Recycle** (24 h grace, cancellable)
and **Send / Transfer**. Owner actions are signed with the device key (biometric /
passcode prompt) and executed by the TAG IT relayer — no gas, no funds move. See
`docs/SEC_TRANSFER_STRIDE.md` for the security model and `docs/ROADMAP.md` for status.
