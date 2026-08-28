import { heroMedia, mapAssetDetail, mapAssetSummary, mediaVariantUrl, summaryFromDetail } from "../mapAsset";
import type { AssetDetail, AssetMediaEntry, AssetSummary } from "../types";

const SHA = "a".repeat(64);
const CDN_MD = `https://media.tagit.network/i/${SHA}/md.webp`;
const CDN_SM = `https://media.tagit.network/i/${SHA}/sm.webp`;

/** Legacy detail body — exactly what the pre-META services returned. */
function legacyDetail(overrides: Partial<AssetDetail> = {}): AssetDetail {
  return {
    tokenId: "43",
    owner: "0x1111111111111111111111111111111111111111",
    stateCode: 4,
    lifecycleState: "CLAIMED",
    name: "Rolex Submariner",
    image: "https://ipfs.io/ipfs/QmHash/image.png",
    timestamp: 1700000000,
    description: "A watch",
    tokenURI: "ipfs://QmHash",
    tagHash: "0x" + "ab".repeat(32),
    flags: 0,
    attributes: [{ trait_type: "Reference", value: "126610LN" }],
    provenance: [],
    ...overrides,
  };
}

/** Full META detail body mirroring tagit-services buildAssetDetail output. */
function metaDetail(): AssetDetail {
  return legacyDetail({
    product: {
      name: "Rolex Submariner",
      brand: "Rolex",
      model: "Submariner Date",
      sku: "126610LN",
      origin: "CH",
      category: "watches",
    },
    media: [
      {
        role: "hero",
        url: CDN_MD,
        mime: "image/webp",
        lqip: "data:image/webp;base64,AAAA",
        blurhash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH",
      },
      { role: "gallery", url: `https://media.tagit.network/i/${"b".repeat(64)}/md.webp`, mime: "image/webp" },
    ],
    price: {
      tokenId: "43",
      priceUsdc6: "1250000000",
      display: "$1,250.00",
      msrp: { amount: 1500, currency: "USD" },
      saleState: "listed",
      version: 3,
      purchase: {
        payTo: "0x2222222222222222222222222222222222222222",
        token: "0x3333333333333333333333333333333333333333",
        chainId: 84532,
        settleEndpoint: "/api/v1/sale/settle",
      },
      fx: { currency: "EUR", approx: "€1.150,00" },
    },
    verification: {
      anchoredVersion: 3,
      latestVersion: 3,
      anchorStatus: "confirmed",
      metadataHash: "0x" + "cd".repeat(32),
      verified: true,
    },
  });
}

describe("mediaVariantUrl", () => {
  it("rewrites a CDN variant URL to the requested variant", () => {
    expect(mediaVariantUrl(CDN_MD, "sm")).toBe(CDN_SM);
    expect(mediaVariantUrl(CDN_SM, "lg")).toBe(`https://media.tagit.network/i/${SHA}/lg.webp`);
  });

  it("returns undefined for non-CDN URLs (ipfs gateway, arbitrary hosts)", () => {
    expect(mediaVariantUrl("https://ipfs.io/ipfs/QmHash/image.png", "sm")).toBeUndefined();
    expect(mediaVariantUrl(undefined, "sm")).toBeUndefined();
  });
});

describe("heroMedia", () => {
  it("prefers the hero role, falls back to the first entry", () => {
    const gallery: AssetMediaEntry = { role: "gallery", url: "https://x/a.webp", mime: "image/webp" };
    const hero: AssetMediaEntry = { role: "hero", url: "https://x/b.webp", mime: "image/webp" };
    expect(heroMedia([gallery, hero])).toBe(hero);
    expect(heroMedia([gallery])).toBe(gallery);
    expect(heroMedia([])).toBeUndefined();
    expect(heroMedia(undefined)).toBeUndefined();
  });
});

describe("mapAssetDetail", () => {
  it("passes every server field through untouched (additive contract)", () => {
    const raw = metaDetail();
    const mapped = mapAssetDetail(raw);
    // Legacy field set: frozen names/types.
    expect(mapped.tokenId).toBe(raw.tokenId);
    expect(mapped.owner).toBe(raw.owner);
    expect(mapped.stateCode).toBe(raw.stateCode);
    expect(mapped.lifecycleState).toBe(raw.lifecycleState);
    expect(mapped.name).toBe(raw.name);
    expect(mapped.image).toBe(raw.image);
    expect(mapped.timestamp).toBe(raw.timestamp);
    expect(mapped.description).toBe(raw.description);
    expect(mapped.tokenURI).toBe(raw.tokenURI);
    expect(mapped.tagHash).toBe(raw.tagHash);
    expect(mapped.flags).toBe(raw.flags);
    expect(mapped.attributes).toEqual(raw.attributes);
    expect(mapped.provenance).toEqual(raw.provenance);
    // Additive blocks verbatim.
    expect(mapped.product).toEqual(raw.product);
    expect(mapped.media).toEqual(raw.media);
    expect(mapped.price).toEqual(raw.price);
    expect(mapped.verification).toEqual(raw.verification);
  });

  it("hoists msrp and saleState out of the nested price block", () => {
    const mapped = mapAssetDetail(metaDetail());
    expect(mapped.msrp).toEqual({ amount: 1500, currency: "USD" });
    expect(mapped.saleState).toBe("listed");
  });

  it("derives thumb (sm CDN variant) and blurhash from the hero media entry", () => {
    const mapped = mapAssetDetail(metaDetail());
    expect(mapped.thumb).toBe(CDN_SM);
    expect(mapped.blurhash).toBe("LKO2?U%2Tw=w]~RBVZRi};RPxuwH");
  });

  it("prefers a server-sent variants map over URL rewriting", () => {
    const raw = metaDetail();
    raw.media![0].variants = { sm: "https://media.tagit.network/i/explicit/sm.webp" };
    expect(mapAssetDetail(raw).thumb).toBe("https://media.tagit.network/i/explicit/sm.webp");
  });

  it("keeps server-sent thumb/blurhash when already present on the body", () => {
    const raw = metaDetail();
    raw.thumb = "https://media.tagit.network/i/server/sm.webp";
    raw.blurhash = "SERVERHASH";
    const mapped = mapAssetDetail(raw);
    expect(mapped.thumb).toBe("https://media.tagit.network/i/server/sm.webp");
    expect(mapped.blurhash).toBe("SERVERHASH");
  });

  it("leaves every optional field absent on a legacy body (absent-optional-fields)", () => {
    const mapped = mapAssetDetail(legacyDetail());
    expect(mapped.product).toBeUndefined();
    expect(mapped.price).toBeUndefined();
    expect(mapped.media).toBeUndefined();
    expect(mapped.verification).toBeUndefined();
    expect(mapped.msrp).toBeUndefined();
    expect(mapped.saleState).toBeUndefined();
    expect(mapped.thumb).toBeUndefined();
    expect(mapped.blurhash).toBeUndefined();
    // Own-property check: absent must stay absent, not become `undefined`
    // (JSON.stringify parity for cache round-trips).
    expect("msrp" in mapped).toBe(false);
    expect("saleState" in mapped).toBe(false);
    expect("thumb" in mapped).toBe(false);
    expect("blurhash" in mapped).toBe(false);
  });

  it("handles a price block without msrp (not_for_sale, nulls)", () => {
    const raw = legacyDetail({
      price: { priceUsdc6: null, display: null, saleState: "not_for_sale" },
    });
    const mapped = mapAssetDetail(raw);
    expect(mapped.msrp).toBeUndefined();
    expect(mapped.saleState).toBe("not_for_sale");
    expect(mapped.price).toEqual({ priceUsdc6: null, display: null, saleState: "not_for_sale" });
  });

  it("does not derive a thumb from non-CDN hero URLs", () => {
    const raw = legacyDetail({
      media: [{ role: "hero", url: "https://ipfs.io/ipfs/QmHash/img.png", mime: "image/png" }],
    });
    expect(mapAssetDetail(raw).thumb).toBeUndefined();
  });
});

describe("mapAssetSummary", () => {
  it("passes summaries through, preserving additive thumb/blurhash", () => {
    const raw: AssetSummary = {
      tokenId: "7",
      owner: "0x1111111111111111111111111111111111111111",
      stateCode: 3,
      lifecycleState: "ACTIVATED",
      timestamp: 1,
      thumb: CDN_SM,
      blurhash: "HASH",
    };
    expect(mapAssetSummary(raw)).toEqual(raw);
  });
});

describe("summaryFromDetail", () => {
  it("projects the summary fields incl. derived thumb/blurhash", () => {
    const summary = summaryFromDetail(metaDetail());
    expect(summary).toEqual({
      tokenId: "43",
      owner: "0x1111111111111111111111111111111111111111",
      stateCode: 4,
      lifecycleState: "CLAIMED",
      name: "Rolex Submariner",
      image: "https://ipfs.io/ipfs/QmHash/image.png",
      timestamp: 1700000000,
      thumb: CDN_SM,
      blurhash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH",
    });
  });

  it("omits thumb/blurhash for legacy details", () => {
    const summary = summaryFromDetail(legacyDetail());
    expect("thumb" in summary).toBe(false);
    expect("blurhash" in summary).toBe(false);
  });
});
