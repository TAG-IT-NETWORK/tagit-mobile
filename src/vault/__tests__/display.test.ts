/**
 * META-T39 UI-layer render decisions, tested as pure functions (the v1 Jest
 * runner is node-env / logic-only — see jest.config.js — so AssetCard /
 * detail / Result image + badge behavior is exercised via src/vault/display).
 */
import {
  detailImageUri,
  gridImageUri,
  listedBadgeLabel,
  resultThumbUri,
  type PricedAsset,
} from "../display";
import type { AssetDetail, AssetPrice, AssetSummary } from "../types";

const SHA = "a".repeat(64);
const CDN_ORIG = `https://media.tagit.network/i/${SHA}/orig.webp`;
const CDN_LG = `https://media.tagit.network/i/${SHA}/lg.webp`;
const CDN_MD = `https://media.tagit.network/i/${SHA}/md.webp`;
const CDN_SM = `https://media.tagit.network/i/${SHA}/sm.webp`;
const IPFS_IMG = "https://ipfs.io/ipfs/QmHash/image.png";

function summary(overrides: Partial<AssetSummary> = {}): AssetSummary {
  return {
    tokenId: "43",
    owner: "0x1111111111111111111111111111111111111111",
    stateCode: 4,
    lifecycleState: "CLAIMED",
    name: "Rolex Submariner",
    timestamp: 1700000000,
    ...overrides,
  };
}

function detail(overrides: Partial<AssetDetail> = {}): AssetDetail {
  // Drop the summary-typed price: details carry the full AssetPrice shape.
  const { price: _price, ...base } = summary();
  return {
    ...base,
    flags: 0,
    provenance: [],
    ...overrides,
  };
}

function listedPrice(overrides: Partial<AssetPrice> = {}): AssetPrice {
  return {
    priceUsdc6: "1250000000",
    display: "$1,250.00",
    saleState: "listed",
    ...overrides,
  };
}

describe("gridImageUri (AssetCard image)", () => {
  it("prefers the sm CDN thumb when present", () => {
    expect(gridImageUri(summary({ thumb: CDN_SM, image: IPFS_IMG }))).toBe(CDN_SM);
  });

  it("falls back to the legacy image when there is no thumb", () => {
    expect(gridImageUri(summary({ image: IPFS_IMG }))).toBe(IPFS_IMG);
  });

  it("returns undefined with neither (cube-icon fallback, layout kept)", () => {
    expect(gridImageUri(summary())).toBeUndefined();
  });
});

describe("detailImageUri (detail hero loads lg)", () => {
  it("rewrites a CDN hero URL to the lg variant", () => {
    const asset = detail({
      media: [{ role: "hero", url: CDN_ORIG, mime: "image/webp" }],
    });
    expect(detailImageUri(asset)).toBe(CDN_LG);
  });

  it("uses the raw hero URL when it is not a CDN variant URL", () => {
    const asset = detail({
      media: [{ role: "hero", url: IPFS_IMG, mime: "image/png" }],
      image: "https://other/legacy.png",
    });
    expect(detailImageUri(asset)).toBe(IPFS_IMG);
  });

  it("falls back to the legacy image when there is no media block", () => {
    expect(detailImageUri(detail({ image: IPFS_IMG }))).toBe(IPFS_IMG);
  });

  it("returns undefined with no media and no image (cube-icon fallback)", () => {
    expect(detailImageUri(detail())).toBeUndefined();
  });
});

describe("resultThumbUri (verify Result thumb)", () => {
  it("derives the sm variant from a CDN image URL", () => {
    expect(resultThumbUri(CDN_MD)).toBe(CDN_SM);
  });

  it("passes non-CDN images through unchanged", () => {
    expect(resultThumbUri(IPFS_IMG)).toBe(IPFS_IMG);
  });

  it("returns undefined when the verifier sent no image", () => {
    expect(resultThumbUri(undefined)).toBeUndefined();
  });
});

describe("listedBadgeLabel (AssetCard 'Listed · $xx.xx' badge)", () => {
  it("renders 'Listed · <display>' when listed with a display price", () => {
    const asset: PricedAsset = { ...summary(), price: listedPrice() };
    expect(listedBadgeLabel(asset)).toBe("Listed · $1,250.00");
  });

  it("lights up from the trimmed owner-list price block ({display, saleState} only)", () => {
    // Exactly what the Week-C list endpoint sends per item — no settlement fields.
    const asset: PricedAsset = summary({
      price: { display: "$1,250.00", saleState: "listed" },
    });
    expect(listedBadgeLabel(asset)).toBe("Listed · $1,250.00");
  });

  it("resolves saleState from the hoisted field (detail-shaped rows)", () => {
    const asset: PricedAsset = { ...summary(), saleState: "listed", price: listedPrice() };
    expect(listedBadgeLabel(asset)).toBe("Listed · $1,250.00");
  });

  it("no badge when not listed, even with a display price", () => {
    expect(
      listedBadgeLabel({ ...summary(), price: listedPrice({ saleState: "not_for_sale" }) }),
    ).toBeUndefined();
    expect(
      listedBadgeLabel({ ...summary(), price: listedPrice({ saleState: "sold" }) }),
    ).toBeUndefined();
  });

  it("no badge when listed but the display price is missing", () => {
    expect(
      listedBadgeLabel({ ...summary(), price: listedPrice({ display: null }) }),
    ).toBeUndefined();
  });

  it("no badge on a plain summary without a price block", () => {
    expect(listedBadgeLabel(summary())).toBeUndefined();
  });

  it("hoisted saleState alone (no price block) still renders no badge", () => {
    expect(listedBadgeLabel({ ...summary(), saleState: "listed" })).toBeUndefined();
  });
});
