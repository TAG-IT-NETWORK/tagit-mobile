import { availableActions, STATE } from "../rules";
import { LIFECYCLE_STATES } from "../../config/constants";
import { STATE_CLAIMED } from "../../wallet/transfer";

describe("STATE codes", () => {
  it("match LIFECYCLE_STATES indices and the transfer module", () => {
    expect(LIFECYCLE_STATES[STATE.BOUND]).toBe("BOUND");
    expect(LIFECYCLE_STATES[STATE.ACTIVATED]).toBe("ACTIVATED");
    expect(LIFECYCLE_STATES[STATE.CLAIMED]).toBe("CLAIMED");
    expect(LIFECYCLE_STATES[STATE.FLAGGED]).toBe("FLAGGED");
    expect(LIFECYCLE_STATES[STATE.RECYCLED]).toBe("RECYCLED");
    expect(STATE.CLAIMED).toBe(STATE_CLAIMED);
  });
});

describe("availableActions", () => {
  const base = { stateCode: STATE.CLAIMED, isOwner: true, saleState: "not-listed" as const, pendingRecycle: false };

  it("non-owner gets nothing", () => {
    expect(availableActions({ ...base, isOwner: false })).toEqual([]);
  });
  it("claimed + not listed → list, flag, recycle", () => {
    expect(availableActions(base)).toEqual(["list", "flag", "recycle"]);
  });
  it("claimed + listed → delist instead of list", () => {
    expect(availableActions({ ...base, saleState: "listed" })).toEqual(["delist", "flag", "recycle"]);
  });
  it("unknown sale state still offers list (server decides)", () => {
    expect(availableActions({ ...base, saleState: "unknown" })).toEqual(["list", "flag", "recycle"]);
  });
  it("bound / activated → flag + recycle only (no selling before claim)", () => {
    expect(availableActions({ ...base, stateCode: STATE.BOUND })).toEqual(["flag", "recycle"]);
    expect(availableActions({ ...base, stateCode: STATE.ACTIVATED })).toEqual(["flag", "recycle"]);
  });
  it("flagged / recycled / minted → nothing", () => {
    expect(availableActions({ ...base, stateCode: STATE.FLAGGED })).toEqual([]);
    expect(availableActions({ ...base, stateCode: STATE.RECYCLED })).toEqual([]);
    expect(availableActions({ ...base, stateCode: 1 })).toEqual([]);
    expect(availableActions({ ...base, stateCode: 0 })).toEqual([]);
  });
  it("a scheduled recycle collapses everything to cancel-recycle", () => {
    expect(availableActions({ ...base, pendingRecycle: true, saleState: "listed" })).toEqual(["cancel-recycle"]);
  });
});
