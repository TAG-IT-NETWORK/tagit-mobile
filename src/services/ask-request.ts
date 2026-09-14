/**
 * Pure helpers for the Ask client (no React Native imports → unit-testable).
 *
 * The server (tagit-services POST /api/v1/ask) grounds the conversation
 * itself: it loads the asset through the same visibility-gated serializer the
 * Vault uses, keyed by `tokenId`. The app therefore sends ONLY the chat
 * history and the token id — never client-assembled "facts" (META-T28: a
 * client could otherwise inject arbitrary text into the system prompt).
 */
export interface AskTurn {
  role: "user" | "assistant";
  content: string;
}

export function buildAskBody(messages: AskTurn[], tokenId?: string): string {
  const history = messages
    .filter((m) => m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content }));
  return JSON.stringify(tokenId && /^\d+$/.test(tokenId) ? { messages: history, tokenId } : { messages: history });
}

/** Authorization header for Ask: the app-tier key, else the general key, else none. */
export function askAuthHeaders(askKey: string, apiKey: string): Record<string, string> {
  const key = askKey || apiKey;
  return key ? { Authorization: `Bearer ${key}` } : {};
}

/** Human copy for a failed Ask connection, keyed on the HTTP status (0 = no response). */
export function askErrorMessage(status: number | undefined, serverMessage?: string): string {
  if (serverMessage && serverMessage.trim()) return serverMessage.trim();
  switch (status) {
    case 401:
    case 403:
      return "Ask isn't enabled in this app build — please update the app.";
    case 404:
      return "Ask isn't available on this server.";
    case 429:
      return "Too many questions right now — try again in a few minutes.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "Ask is temporarily unavailable. Please try again later.";
    default:
      return "Connection error — check your network and try again.";
  }
}
