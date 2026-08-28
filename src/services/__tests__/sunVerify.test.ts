/**
 * sunVerify mapping tests (META-T38): the verifier's product fields
 * (name/image/brand/sku/origin/msrp) map through onto VerifyResponse.asset
 * instead of being discarded; absent fields stay absent.
 */
import { verifySunViaWeb } from "../sunVerify";
import { VerifyApiError } from "../api";
import type { SunData } from "../../types/nfc";

const SUN: SunData = {
  uid: "",
  picc: "AB".repeat(16),
  ctr: "",
  cmac: "2446E5A3B7F81D90",
  tokenId: 0,
  rawUrl: "https://tagit.network/verify?picc=...&cmac=...",
  format: "encrypted",
};

function mockFetchOnce(body: unknown, status = 200) {
  const fn = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  (global as { fetch: unknown }).fetch = fn;
  return fn;
}

describe("verifySunViaWeb", () => {
  it("maps product fields through (name/image/brand/sku/origin/msrp)", async () => {
    mockFetchOnce({
      verified: true,
      uid: "049F5032A16C80",
      tapCounter: 7,
      asset: {
        tokenId: "43",
        stateCode: 4,
        lifecycleState: "CLAIMED",
        owner: "0x1111111111111111111111111111111111111111",
        timestamp: 1700000000,
        name: "Rolex Submariner",
        image: "https://media.tagit.network/i/abc/md.webp",
        brand: "Rolex",
        sku: "126610LN",
        origin: "CH",
        msrp: "$15,000",
      },
      chain: { id: 84532, name: "Base Sepolia" },
    });

    const { response, uid } = await verifySunViaWeb(SUN);

    expect(uid).toBe("049F5032A16C80");
    expect(response.verified).toBe(true);
    // Legacy fields untouched.
    expect(response.asset.tokenId).toBe("43");
    expect(response.asset.stateCode).toBe(4);
    expect(response.asset.lifecycleState).toBe("CLAIMED");
    expect(response.asset.owner).toBe("0x1111111111111111111111111111111111111111");
    expect(response.asset.timestamp).toBe(1700000000);
    // Product fields no longer discarded.
    expect(response.asset.name).toBe("Rolex Submariner");
    expect(response.asset.image).toBe("https://media.tagit.network/i/abc/md.webp");
    expect(response.asset.brand).toBe("Rolex");
    expect(response.asset.sku).toBe("126610LN");
    expect(response.asset.origin).toBe("CH");
    expect(response.asset.msrp).toBe("$15,000");
  });

  it("leaves product fields undefined when the verifier omits them", async () => {
    mockFetchOnce({
      verified: true,
      asset: {
        tokenId: "7",
        stateCode: 3,
        lifecycleState: "ACTIVATED",
        owner: "0x2222222222222222222222222222222222222222",
        timestamp: 42,
      },
    });

    const { response } = await verifySunViaWeb(SUN);
    expect(response.asset.name).toBeUndefined();
    expect(response.asset.image).toBeUndefined();
    expect(response.asset.brand).toBeUndefined();
    expect(response.asset.sku).toBeUndefined();
    expect(response.asset.origin).toBeUndefined();
    expect(response.asset.msrp).toBeUndefined();
  });

  it("still maps the unverified fallback (no asset block)", async () => {
    mockFetchOnce({ verified: false, reason: "UNKNOWN_TAG" });

    const { response, uid } = await verifySunViaWeb(SUN);
    expect(uid).toBe(SUN.uid);
    expect(response.verified).toBe(false);
    expect(response.asset.tokenId).toBe("0");
    expect(response.asset.lifecycleState).toBe("UNKNOWN_TAG");
    expect(response.asset.name).toBeUndefined();
  });

  it("surfaces structured verifier errors", async () => {
    mockFetchOnce({ error: "verifier not configured" }, 503);
    await expect(verifySunViaWeb(SUN)).rejects.toThrow(VerifyApiError);
  });
});
