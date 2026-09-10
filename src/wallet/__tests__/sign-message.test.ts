// The key accessor is mocked (no SecureStore in node); viem stays real so the
// signature is verified for real with verifyMessage.
jest.mock("../embedded", () => ({ getSigningKey: jest.fn() }));

import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { verifyMessage } from "viem";
import { signOwnerActionMessage, UnscopedMessageError } from "../sign-message";
import { KeyMismatchError } from "../signer";
import { getSigningKey } from "../embedded";
import { ownerActionMessage } from "../../owner-actions/message";

const pk = generatePrivateKey();
const OWNER = privateKeyToAccount(pk).address;
const MSG = ownerActionMessage("55", "flag", { reason: "stolen" }, 1757500000000);

beforeEach(() => {
  jest.clearAllMocks();
  (getSigningKey as jest.Mock).mockResolvedValue(pk);
});

describe("signOwnerActionMessage", () => {
  it("produces an EIP-191 signature that recovers to the owner", async () => {
    const sig = await signOwnerActionMessage(OWNER, MSG, "Confirm");
    expect(sig).toMatch(/^0x[0-9a-f]{130}$/);
    await expect(verifyMessage({ address: OWNER, message: MSG, signature: sig })).resolves.toBe(true);
    // a different message does not verify with the same signature
    await expect(verifyMessage({ address: OWNER, message: MSG + " ", signature: sig })).resolves.toBe(false);
  });

  it("passes the prompt through to the key accessor (OS biometric / passcode)", async () => {
    await signOwnerActionMessage(OWNER, MSG, "Recycle — asset #55");
    expect(getSigningKey).toHaveBeenCalledWith(undefined, "Recycle — asset #55");
  });

  it("refuses a non-owner-action message WITHOUT touching the key", async () => {
    await expect(signOwnerActionMessage(OWNER, "Sign in to Example\nnonce: 1", "x")).rejects.toBeInstanceOf(UnscopedMessageError);
    await expect(signOwnerActionMessage(OWNER, MSG + "\nextra: 1", "x")).rejects.toBeInstanceOf(UnscopedMessageError);
    expect(getSigningKey).not.toHaveBeenCalled();
  });

  it("refuses when the device key does not own the expected signer", async () => {
    const other = privateKeyToAccount(generatePrivateKey()).address;
    await expect(signOwnerActionMessage(other, MSG, "x")).rejects.toBeInstanceOf(KeyMismatchError);
  });

  it("surfaces key-store failures (cancelled prompt, invalidated key)", async () => {
    (getSigningKey as jest.Mock).mockRejectedValue(new Error("User canceled the operation"));
    await expect(signOwnerActionMessage(OWNER, MSG, "x")).rejects.toThrow("User canceled");
  });
});
