import { buildReceivePayload } from "../receive";

// A real checksummed address (EIP-55).
const CHECKSUMMED = "0x3Ed1b3e5a1eCe81891Bde8e6821029305eB0F113";

describe("buildReceivePayload", () => {
  it("returns the address unchanged when already EIP-55 checksummed", () => {
    expect(buildReceivePayload(CHECKSUMMED)).toBe(CHECKSUMMED);
  });

  it("checksums an all-lowercase address", () => {
    expect(buildReceivePayload(CHECKSUMMED.toLowerCase())).toBe(CHECKSUMMED);
  });

  it("returns null for null, undefined, and empty string", () => {
    expect(buildReceivePayload(null)).toBeNull();
    expect(buildReceivePayload(undefined)).toBeNull();
    expect(buildReceivePayload("")).toBeNull();
  });

  it("returns null for non-address input", () => {
    expect(buildReceivePayload("not-an-address")).toBeNull();
    expect(buildReceivePayload("0x1234")).toBeNull();
  });

  it("rejects (never repairs) a mixed-case address with a wrong checksum", () => {
    // Flip the case of one letter so the EIP-55 checksum no longer validates.
    const corrupted = CHECKSUMMED.replace("Ed", "eD");
    expect(buildReceivePayload(corrupted)).toBeNull();
  });
});
