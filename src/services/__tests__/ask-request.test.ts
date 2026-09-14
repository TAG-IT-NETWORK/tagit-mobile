import { askAuthHeaders, askErrorMessage, buildAskBody } from "../ask-request";

describe("buildAskBody", () => {
  it("sends history + tokenId only (server-side grounding, META-T28)", () => {
    const body = JSON.parse(buildAskBody([{ role: "user", content: "What is this?" }], "43"));
    expect(body).toEqual({ messages: [{ role: "user", content: "What is this?" }], tokenId: "43" });
    expect(body).not.toHaveProperty("assetContext");
  });
  it("omits tokenId when absent or not a decimal id, and drops empty turns", () => {
    expect(JSON.parse(buildAskBody([{ role: "user", content: "hi" }, { role: "assistant", content: "" }]))).toEqual({
      messages: [{ role: "user", content: "hi" }],
    });
    expect(JSON.parse(buildAskBody([{ role: "user", content: "hi" }], "0x12"))).toEqual({ messages: [{ role: "user", content: "hi" }] });
  });
});

describe("askAuthHeaders", () => {
  it("prefers the app-tier Ask key, falls back to the general key, else nothing", () => {
    expect(askAuthHeaders("ask-key", "api-key")).toEqual({ Authorization: "Bearer ask-key" });
    expect(askAuthHeaders("", "api-key")).toEqual({ Authorization: "Bearer api-key" });
    expect(askAuthHeaders("", "")).toEqual({});
  });
});

describe("askErrorMessage", () => {
  it("uses the server's message when present", () => {
    expect(askErrorMessage(503, "Ask is not configured")).toBe("Ask is not configured");
  });
  it("maps statuses to human copy and defaults to a network error", () => {
    expect(askErrorMessage(401)).toMatch(/update the app/);
    expect(askErrorMessage(429)).toMatch(/Too many/);
    expect(askErrorMessage(503)).toMatch(/temporarily unavailable/);
    expect(askErrorMessage(0)).toMatch(/Connection error/);
    expect(askErrorMessage(undefined)).toMatch(/Connection error/);
  });
});
