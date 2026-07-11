import { getAddress, decodeFunctionData } from "viem";
import {
  encodeTransferCalldata,
  decodeTransfer,
  computeCanonicalHash,
  validateRecipient,
  groupAddress,
  InvalidRecipientError,
  type CanonicalTx,
} from "../transfer";
import { tagitCoreAbi } from "../../onchain/abis/TAGITCore";

const FROM = getAddress("0x3Ed1b3e5a1eCe81891Bde8e6821029305eB0F113");
const TO = getAddress("0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38");
const CORE = getAddress("0x3aDc7EFDb58Ae85483eFf5D4966D916185f31d1D");

function baseTx(over: Partial<CanonicalTx> = {}): CanonicalTx {
  return {
    to: CORE,
    value: 0n,
    data: encodeTransferCalldata(7n, TO),
    chainId: 84532,
    nonce: 3,
    maxFeePerGas: 1_000_000_000n,
    maxPriorityFeePerGas: 1_000_000n,
    gas: 120_000n,
    ...over,
  };
}

describe("transfer calldata", () => {
  it("encodes transferAsset(tokenId,to) that the ABI decodes back", () => {
    const data = encodeTransferCalldata(42n, TO);
    const { functionName, args } = decodeFunctionData({ abi: tagitCoreAbi, data });
    expect(functionName).toBe("transferAsset");
    expect(args?.[0]).toBe(42n);
    expect(getAddress(args?.[1] as string)).toBe(TO);
  });

  it("decodeTransfer yields the authoritative tokenId + recipient (for the Confirm screen)", () => {
    const data = encodeTransferCalldata(99n, TO);
    const d = decodeTransfer(data);
    expect(d.tokenId).toBe(99n);
    expect(d.to).toBe(TO);
  });

  it("decodeTransfer rejects non-transfer calldata", () => {
    const balanceOf = "0x70a08231000000000000000000000000" + TO.slice(2).toLowerCase();
    expect(() => decodeTransfer(balanceOf as `0x${string}`)).toThrow();
  });
});

describe("canonical hash binding", () => {
  it("is stable for identical tx fields", () => {
    expect(computeCanonicalHash(baseTx())).toBe(computeCanonicalHash(baseTx()));
  });

  it("CHANGES when ANY bound field changes (to, value, data, chainId, nonce, fees, gas)", () => {
    const base = computeCanonicalHash(baseTx());
    const OTHER = getAddress("0x000000000000000000000000000000000000dEaD");
    const variants: Partial<CanonicalTx>[] = [
      { to: OTHER },
      { value: 1n },
      { data: encodeTransferCalldata(8n, TO) }, // different tokenId
      { data: encodeTransferCalldata(7n, OTHER) }, // different recipient
      { chainId: 1 },
      { nonce: 4 },
      { maxFeePerGas: 2_000_000_000n },
      { maxPriorityFeePerGas: 2_000_000n },
      { gas: 130_000n },
    ];
    for (const v of variants) {
      expect(computeCanonicalHash(baseTx(v))).not.toBe(base);
    }
  });
});

describe("validateRecipient (typo detection only — not a spoofing control)", () => {
  it("accepts a valid checksummed address and returns it checksummed", () => {
    expect(validateRecipient(TO, FROM)).toBe(TO);
    expect(validateRecipient(TO.toLowerCase(), FROM)).toBe(TO);
  });
  it("rejects empty / malformed", () => {
    expect(() => validateRecipient("", FROM)).toThrow(InvalidRecipientError);
    expect(() => validateRecipient("0x123", FROM)).toThrow(InvalidRecipientError);
    expect(() => validateRecipient("not-an-address", FROM)).toThrow(InvalidRecipientError);
  });
  it("rejects the zero address", () => {
    expect(() => validateRecipient("0x0000000000000000000000000000000000000000", FROM)).toThrow(
      InvalidRecipientError,
    );
  });
  it("rejects sending to self (case-insensitive)", () => {
    expect(() => validateRecipient(FROM.toLowerCase(), FROM)).toThrow(InvalidRecipientError);
  });
});

describe("groupAddress", () => {
  it("renders the full address (no truncation), grouped by spaces", () => {
    const g = groupAddress(TO);
    expect(g.replace(/ /g, "")).toBe(TO); // spaces are the only added chars
    expect(g.startsWith("0x ")).toBe(true);
  });
});
