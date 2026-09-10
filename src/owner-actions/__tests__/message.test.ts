import { canonicalParams, paramsDigest, ownerActionMessage, isOwnerActionMessage, PRICE_RE } from "../message";

// Golden vectors produced by tagit-services src/owner-actions/service.ts
// (node:crypto sha256) on 2026-09-10 — app ↔ server parity, byte for byte.
const TS = 1757500000000;

describe("ownerActionMessage (app ↔ server parity)", () => {
  it("flag with reason + note", () => {
    expect(ownerActionMessage("55", "flag", { reason: "stolen", note: "Taken from my car in Boston" }, TS)).toBe(
      "TAG IT owner action\ntoken: 55\naction: flag\nparams-sha256: 9803284b5d251036736dd13c9b23726d0f652a490dbf451e2f792907d5f8f417\nts: 1757500000000",
    );
  });
  it("list — empty / null params are dropped before hashing", () => {
    expect(ownerActionMessage(55n, "list", { currency: "USD", price: "25.00", empty: "", nil: null }, TS)).toBe(
      "TAG IT owner action\ntoken: 55\naction: list\nparams-sha256: 735af188dbc36e5dc94896db478384f34189f2fa65b0a8e4003038f754b49a58\nts: 1757500000000",
    );
  });
  it("delist with {} and recycle with undefined both digest to 'none'", () => {
    expect(ownerActionMessage("58", "delist", {}, TS)).toBe(
      "TAG IT owner action\ntoken: 58\naction: delist\nparams-sha256: none\nts: 1757500000000",
    );
    expect(ownerActionMessage("58", "recycle", undefined, TS)).toBe(
      "TAG IT owner action\ntoken: 58\naction: recycle\nparams-sha256: none\nts: 1757500000000",
    );
  });
});

describe("canonicalParams / paramsDigest", () => {
  it("sorts keys and drops undefined", () => {
    expect(canonicalParams({ b: 2, a: "x", c: undefined })).toBe('{"a":"x","b":2}');
    expect(paramsDigest({ b: 2, a: "x" })).toBe("768ca668c0f84dd39bf269e25c9a3f0af4812e41026b6fead9a2666078ef16f6");
  });
  it("is order-independent", () => {
    expect(paramsDigest({ reason: "lost", method: "self" })).toBe(paramsDigest({ method: "self", reason: "lost" }));
  });
});

describe("isOwnerActionMessage (signer scope fence)", () => {
  it("accepts exactly the canonical shape", () => {
    expect(isOwnerActionMessage(ownerActionMessage("1", "flag", { reason: "x" }, TS))).toBe(true);
    expect(isOwnerActionMessage(ownerActionMessage("1", "cancel-recycle", {}, TS))).toBe(true);
  });
  it("rejects anything else — permits, logins, extra lines, wrong prefix", () => {
    expect(isOwnerActionMessage("Sign in to Example\nnonce: 1")).toBe(false);
    expect(isOwnerActionMessage("TAG IT owner action\ntoken: 1\naction: transfer\nparams-sha256: none\nts: 1")).toBe(false);
    expect(isOwnerActionMessage(ownerActionMessage("1", "flag", {}, TS) + "\nextra")).toBe(false);
    expect(isOwnerActionMessage("TAG IT owner action\ntoken: 1\naction: flag\nparams-sha256: zz\nts: 1")).toBe(false);
  });
});

describe("PRICE_RE (server rule)", () => {
  it.each(["25", "19.99", "0.000001", "123456789012.5"])("accepts %s", (p) => expect(PRICE_RE.test(p)).toBe(true));
  it.each(["", "-1", "1.1234567", "1e3", "$25", "25,00"])("rejects %s", (p) => expect(PRICE_RE.test(p)).toBe(false));
});
