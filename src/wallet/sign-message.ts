/**
 * Owner-action message signer — the ONLY module that signs a plain message
 * with the device key (EIP-191 personal_sign). Lives in src/wallet/ because it
 * touches `getSigningKey` (CI import fence; docs/SEC_TRANSFER_STRIDE.md).
 *
 * Two refusals before the key is ever read:
 *   1. the text must be a TAG IT owner-action message (isOwnerActionMessage) —
 *      this path cannot be repurposed to sign permits, login challenges or
 *      typed data a hostile screen might feed it;
 *   2. the key must own `expectedSigner` (the address the screen showed).
 * Reading the key triggers the OS biometric / passcode prompt — that prompt
 * IS the "passcode" gate for destructive actions such as recycle.
 */
import { privateKeyToAccount } from "viem/accounts";
import type { Address, Hex } from "viem";
import { getSigningKey } from "./embedded";
import { KeyMismatchError } from "./signer";
import { isOwnerActionMessage } from "../owner-actions/message";

export class UnscopedMessageError extends Error {
  constructor() {
    super("Refusing to sign: not a TAG IT owner-action message.");
    this.name = "UnscopedMessageError";
  }
}

export async function signOwnerActionMessage(
  expectedSigner: Address,
  message: string,
  authPrompt: string,
): Promise<Hex> {
  if (!isOwnerActionMessage(message)) throw new UnscopedMessageError();
  const pk = await getSigningKey(undefined, authPrompt);
  const account = privateKeyToAccount(pk);
  if (account.address.toLowerCase() !== expectedSigner.toLowerCase()) throw new KeyMismatchError();
  return account.signMessage({ message });
}
