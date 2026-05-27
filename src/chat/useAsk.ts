/**
 * useAsk — drives a grounded chat turn: append the user message, open a
 * streaming assistant reply, and append deltas into the store. Streaming is an
 * enhancement; on error the assistant bubble shows the error text.
 */
import { useCallback, useRef, useEffect } from "react";
import { useChatStore } from "./store";
import { streamAsk, type AskAssetContext } from "../services/ask";

export function useAsk(assetContext?: AskAssetContext) {
  const messages = useChatStore((s) => s.messages);
  const streaming = useChatStore((s) => s.streaming);
  const closeRef = useRef<(() => void) | null>(null);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const store = useChatStore.getState();

      store.addMessage({ role: "user", content: trimmed, assetTokenId: assetContext?.tokenId });
      // History sent upstream = everything so far (user + prior assistant turns).
      const history = useChatStore
        .getState()
        .messages.map((m) => ({ role: m.role, content: m.content }));

      store.addMessage({ role: "assistant", content: "", assetTokenId: assetContext?.tokenId });
      store.setStreaming(true);

      closeRef.current = streamAsk(history, assetContext, {
        onDelta: (chunk) => useChatStore.getState().appendToLast(chunk),
        onDone: () => useChatStore.getState().setStreaming(false),
        onError: (message) => {
          const s = useChatStore.getState();
          s.appendToLast(s.messages[s.messages.length - 1]?.content ? "" : `⚠️ ${message}`);
          s.setStreaming(false);
        },
      });
    },
    [assetContext],
  );

  const stop = useCallback(() => {
    closeRef.current?.();
    useChatStore.getState().setStreaming(false);
  }, []);

  // Abort any in-flight stream on unmount.
  useEffect(() => () => closeRef.current?.(), []);

  return { messages, streaming, send, stop, clear: useChatStore.getState().clear };
}
