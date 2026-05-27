import { stateName, stateLabel, stateColor } from "../lifecycle";

describe("lifecycle state mapping", () => {
  it("maps known numeric states to enum names", () => {
    expect(stateName(0)).toBe("NONE");
    expect(stateName(1)).toBe("MINTED");
    expect(stateName(2)).toBe("BOUND");
    expect(stateName(3)).toBe("ACTIVATED");
    expect(stateName(4)).toBe("CLAIMED");
    expect(stateName(5)).toBe("FLAGGED");
    expect(stateName(6)).toBe("RECYCLED");
  });

  it("returns UNKNOWN for out-of-range states", () => {
    expect(stateName(7)).toBe("UNKNOWN");
    expect(stateName(255)).toBe("UNKNOWN");
    expect(stateName(-1)).toBe("UNKNOWN");
  });

  it("produces display labels", () => {
    expect(stateLabel(3)).toBe("Activated");
    expect(stateLabel(99)).toBe("Unknown");
  });

  it("produces a color for every valid state and the fallback", () => {
    for (let i = 0; i <= 6; i++) {
      expect(stateColor(i)).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
    expect(stateColor(42)).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});
