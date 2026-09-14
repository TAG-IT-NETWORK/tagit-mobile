/**
 * Streaming client for POST /api/v1/ask (Server-Sent Events).
 * Backend emits: event "delta" {text}, "done" {}, "error" {message}.
 * Grounding: the server loads the asset by `tokenId` (see ask-request.ts).
 */
import EventSource from "react-native-sse";
import { API_URL, API_KEY, ASK_KEY } from "../config/env";
import type { ChatMessage } from "../chat/store";
import { askAuthHeaders, askErrorMessage, buildAskBody } from "./ask-request";

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
  tokenId: string | undefined,
  handlers: AskHandlers,
): () => void {
  const es = new EventSource<AskEvent>(`${API_URL}/api/v1/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...askAuthHeaders(ASK_KEY, API_KEY),
    },
    body: buildAskBody(messages, tokenId),
    // We manage the connection lifecycle; no auto-reconnect polling.
    pollingInterval: 0,
    // Fail cleanly instead of hanging forever if the server stops streaming
    // (default is 0 = no timeout). Generous enough for a slow LLM turn.
    timeout: 60000,
    timeoutBeforeConnection: 0,
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
    // Three shapes arrive here: our SSE "error" frame ({data: '{"message"}'}),
    // a transport ErrorEvent ({xhrStatus, message}) for non-200 responses, or
    // a timeout. Prefer the server's own message, then map the status.
    const ev = event as { data?: string; xhrStatus?: number; message?: string; type?: string };
    let serverMessage: string | undefined;
    if (ev.data) {
      try {
        serverMessage = (JSON.parse(ev.data) as { message?: string }).message;
      } catch {
        /* not our frame */
      }
    }
    handlers.onError(
      ev.type === "timeout"
        ? "The answer took too long — please try again."
        : askErrorMessage(ev.xhrStatus, serverMessage),
    );
    close();
  });

  return close;
}
