// Mock the key accessor and the network client; keep viem real except the
// wallet client (so no signing hits the network and we can assert it is/ isn't
// called).
jest.mock("../embedded", () => ({ getSigningKey: jest.fn() }));
jest.mock("../../onchain/clients", () => ({ getPublicClient: jest.fn() }));

const mockWriteContract = jest.fn();
jest.mock("viem", () => ({
  ...jest.requireActual("viem"),
  createWalletClient: jest.fn(() => ({ writeContract: mockWriteContract })),
}));

import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import type { Address, Hex } from "viem";
import {
  prepareTransfer,
  NotOwnerError,
  NotClaimedError,
  KeyMismatchError,
  AlreadySignedError,
} from "../signer";
import { getSigningKey } from "../embedded";
import { getPublicClient } from "../../onchain/clients";

const ownerPk = generatePrivateKey();
const FROM = privateKeyToAccount(ownerPk).address;
const TO = "0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38" as Address;

function mockChain(over: { owner?: Address; state?: number } = {}) {
  (getPublicClient as jest.Mock).mockReturnValue({
    readContract: jest.fn(async () => [over.owner ?? FROM, 0n, over.state ?? 4, 0, 0]),
    getTransactionCount: jest.fn(async () => 5),
    estimateFeesPerGas: jest.fn(async () => ({
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 1_000_000n,
    })),
    estimateContractGas: jest.fn(async () => 100_000n),
    waitForTransactionReceipt: jest.fn(async () => ({ status: "success" })),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockWriteContract.mockResolvedValue("0xdead" as Hex);
});

describe("prepareTransfer preflight (read-only, no key touched)", () => {
  it("throws NotOwnerError when the active wallet does not own the asset", async () => {
    mockChain({ owner: TO }); // someone else owns it
    await expect(prepareTransfer(FROM, 7n, TO)).rejects.toThrow(NotOwnerError);
    expect(getSigningKey).not.toHaveBeenCalled();
  });

  it("throws NotClaimedError when the asset is not in CLAIMED state", async () => {
    mockChain({ state: 3 }); // ACTIVATED
    await expect(prepareTransfer(FROM, 7n, TO)).rejects.toThrow(NotClaimedError);
  });

  it("builds a canonical hash without touching the key", async () => {
    mockChain();
    const p = await prepareTransfer(FROM, 7n, TO);
    expect(p.canonicalHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(p.from).toBe(FROM);
    expect(getSigningKey).not.toHaveBeenCalled();
    expect(mockWriteContract).not.toHaveBeenCalled();
  });
});

describe("confirm() — default-deny custody gate", () => {
  it("signs exactly once with the owner key and returns the tx hash", async () => {
    mockChain();
    (getSigningKey as jest.Mock).mockResolvedValue(ownerPk);
    const p = await prepareTransfer(FROM, 7n, TO);
    const hash = await p.confirm();
    expect(hash).toBe("0xdead");
    expect(getSigningKey).toHaveBeenCalledTimes(1);
    expect(mockWriteContract).toHaveBeenCalledTimes(1);
    // the signed call is the exact transferAsset(tokenId,to) with bound params
    const arg = mockWriteContract.mock.calls[0][0];
    expect(arg.functionName).toBe("transferAsset");
    expect(arg.args[0]).toBe(7n);
    expect(arg.nonce).toBe(5);
  });

  it("is single-use: a second confirm() throws and does NOT sign again", async () => {
    mockChain();
    (getSigningKey as jest.Mock).mockResolvedValue(ownerPk);
    const p = await prepareTransfer(FROM, 7n, TO);
    await p.confirm();
    await expect(p.confirm()).rejects.toThrow(AlreadySignedError);
    expect(mockWriteContract).toHaveBeenCalledTimes(1);
  });

  it("REFUSES to sign when the device key does not own the previewed sender", async () => {
    mockChain();
    (getSigningKey as jest.Mock).mockResolvedValue(generatePrivateKey()); // different key
    const p = await prepareTransfer(FROM, 7n, TO);
    await expect(p.confirm()).rejects.toThrow(KeyMismatchError);
    expect(mockWriteContract).not.toHaveBeenCalled(); // nothing signed
  });

  it("allows a retry after a failed signing attempt (e.g. cancelled biometric)", async () => {
    mockChain();
    (getSigningKey as jest.Mock)
      .mockRejectedValueOnce(new Error("user cancelled"))
      .mockResolvedValueOnce(ownerPk);
    const p = await prepareTransfer(FROM, 7n, TO);
    await expect(p.confirm()).rejects.toThrow("user cancelled");
    expect(mockWriteContract).not.toHaveBeenCalled();
    const hash = await p.confirm(); // retry succeeds
    expect(hash).toBe("0xdead");
    expect(mockWriteContract).toHaveBeenCalledTimes(1);
  });
});
