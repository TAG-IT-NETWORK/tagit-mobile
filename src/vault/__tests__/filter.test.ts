import { availableStates, filterAssets, matchesQuery, matchesState } from "../filter";
import type { AssetSummary } from "../types";

function asset(overrides: Partial<AssetSummary>): AssetSummary {
  return {
    tokenId: "1",
    owner: "0x0000000000000000000000000000000000000000",
    stateCode: 4,
    lifecycleState: "CLAIMED",
    timestamp: 0,
    ...overrides,
  };
}

const ROLEX = asset({ tokenId: "43", name: "Rolex Submariner" });
const BIRKIN = asset({ tokenId: "44", name: "Hermès Birkin 30" });
const ACTIVATED = asset({ tokenId: "7", name: "Patek Nautilus", stateCode: 3, lifecycleState: "ACTIVATED" });
const NAMELESS = asset({ tokenId: "99", name: undefined });

describe("matchesQuery", () => {
  it("matches everything on an empty or whitespace query", () => {
    expect(matchesQuery(ROLEX, "")).toBe(true);
    expect(matchesQuery(ROLEX, "   ")).toBe(true);
  });

  it("matches the name case-insensitively", () => {
    expect(matchesQuery(ROLEX, "rolex")).toBe(true);
    expect(matchesQuery(ROLEX, "SUBMARINER")).toBe(true);
    expect(matchesQuery(ROLEX, "birkin")).toBe(false);
  });

  it("matches accented names", () => {
    expect(matchesQuery(BIRKIN, "hermès")).toBe(true);
  });

  it("matches the token id with a bare query", () => {
    expect(matchesQuery(ROLEX, "43")).toBe(true);
    expect(matchesQuery(ROLEX, "44")).toBe(false);
  });

  it("targets the token id only with a leading #", () => {
    expect(matchesQuery(ROLEX, "#43")).toBe(true);
    expect(matchesQuery(ROLEX, "#rolex")).toBe(false);
    // A lone "#" matches nothing rather than everything.
    expect(matchesQuery(ROLEX, "#")).toBe(false);
  });

  it("handles assets without a name", () => {
    expect(matchesQuery(NAMELESS, "99")).toBe(true);
    expect(matchesQuery(NAMELESS, "rolex")).toBe(false);
  });

  it("matches the displayed fallback title for unnamed assets", () => {
    // The card shows "Asset #99" — searching what you see must work.
    expect(matchesQuery(NAMELESS, "asset")).toBe(true);
    expect(matchesQuery(NAMELESS, "Asset #99")).toBe(true);
    expect(matchesQuery(ROLEX, "asset")).toBe(false);
  });

  it("matches NFD-decomposed metadata names typed as precomposed input", () => {
    // "Herm\u00e8s" stored decomposed (e + combining grave U+0300) vs the iOS
    // keyboard's precomposed \u00e8 (U+00E8).
    const decomposed = asset({ tokenId: "5", name: "Herme\u0300s Kelly" });
    expect(matchesQuery(decomposed, "herm\u00e8s")).toBe(true);
  });
});

describe("matchesState", () => {
  it("passes everything through ALL", () => {
    expect(matchesState(ROLEX, "ALL")).toBe(true);
    expect(matchesState(ACTIVATED, "ALL")).toBe(true);
  });

  it("filters by exact lifecycle state", () => {
    expect(matchesState(ROLEX, "CLAIMED")).toBe(true);
    expect(matchesState(ROLEX, "ACTIVATED")).toBe(false);
    expect(matchesState(ACTIVATED, "ACTIVATED")).toBe(true);
  });

  it("hides UNKNOWN-state assets behind any specific state filter", () => {
    const unknown = asset({ stateCode: 42, lifecycleState: "UNKNOWN" });
    expect(matchesState(unknown, "ALL")).toBe(true);
    expect(matchesState(unknown, "CLAIMED")).toBe(false);
  });
});

describe("filterAssets", () => {
  const all = [ROLEX, BIRKIN, ACTIVATED, NAMELESS];

  it("combines query and state filters", () => {
    expect(filterAssets(all, "", "ALL")).toEqual(all);
    expect(filterAssets(all, "", "CLAIMED")).toEqual([ROLEX, BIRKIN, NAMELESS]);
    expect(filterAssets(all, "patek", "ALL")).toEqual([ACTIVATED]);
    expect(filterAssets(all, "patek", "CLAIMED")).toEqual([]);
  });
});

describe("availableStates", () => {
  it("returns the distinct states present in canonical lifecycle order", () => {
    expect(availableStates([ROLEX, BIRKIN, ACTIVATED, NAMELESS])).toEqual(["ACTIVATED", "CLAIMED"]);
  });

  it("omits UNKNOWN (it is not a chip; ALL still shows those assets)", () => {
    const unknown = asset({ stateCode: 42, lifecycleState: "UNKNOWN" });
    expect(availableStates([unknown, ROLEX])).toEqual(["CLAIMED"]);
  });

  it("returns an empty list for no assets", () => {
    expect(availableStates([])).toEqual([]);
  });
});
