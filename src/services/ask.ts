/**
 * Streaming client for POST /api/v1/ask (Server-Sent Events).
 * Backend emits: event "delta" {text}, "done" {}, "error" {message}.
 */
import EventSource from "react-native-sse";
import { API_URL, API_KEY } from "../config/env";
import type { ChatMessage } from "../chat/store";

export interface AskAssetContext {
  tokenId?: string;
  lifecycleState?: string;
  owner?: string;
  name?: string;
  description?: string;
  tagHash?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  provenance?: Array<{ label: string; timestamp?: number }>;
}

export interface AskHandlers {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

type AskEvent = "delta" | "done" | "error";

/**
 * Open a streaming Ask request. Returns a function to close/abort the stream.
 * Only user/assistant text is sent upstream (the store's persisted shape).
 */
export function streamAsk(
  messages: Pick<ChatMessage, "role" | "content">[],
  assetContext: AskAssetContext | undefined,
  handlers: AskHandlers,
): () => void {
  const es = new EventSource<AskEvent>(`${API_URL}/api/v1/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    },
    body: JSON.stringify({ messages, assetContext }),
    // We manage the connection lifecycle; no auto-reconnect polling.
    pollingInterval: 0,
  });

  const close = () => es.close();

  es.addEventListener("delta", (event) => {
    try {
      const data = JSON.parse((event as { data: string }).data) as { text?: string };
      if (data.text) handlers.onDelta(data.text);
    } catch {
      /* ignore malformed frame */
    }
  });

  es.addEventListener("done", () => {
    handlers.onDone();
    close();
  });

  es.addEventListener("error", (event) => {
    let message = "Connection error";
    const data = (event as { data?: string }).data;
    if (data) {
      try {
        message = (JSON.parse(data) as { message?: string }).message ?? message;
      } catch {
        /* keep default */
      }
    }
    handlers.onError(message);
    close();
  });

  return close;
}
