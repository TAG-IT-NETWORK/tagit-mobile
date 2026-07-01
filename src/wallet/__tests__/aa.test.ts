import { emailToHash } from "../aa";

describe("emailToHash (app ↔ backend parity)", () => {
  it("matches the hash the backend produced for owner@example.com", () => {
    // Verified against tagit-services /api/v1/wallet/email/status response.
    expect(emailToHash("owner@example.com")).toBe(
      "0x4c1cc8904dbc2611736bdba48a5d225b59943c7c822388ded3ea284b36d68ca4",
    );
  });

  it("normalizes case and surrounding whitespace", () => {
    expect(emailToHash("  Owner@Example.com ")).toBe(emailToHash("owner@example.com"));
  });

  it("differs for different emails", () => {
    expect(emailToHash("a@b.com")).not.toBe(emailToHash("c@d.com"));
  });
});
