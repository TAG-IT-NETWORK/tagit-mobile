/**
 * Ask (AI chat) store — Zustand, persisted to AsyncStorage.
 *
 * Streaming is treated as an enhancement: tokens append to the last assistant
 * message via appendToLast(); a non-streamed reply can just setLast() the full
 * text. The store never depends on streaming working (see useAsk in Phase 6).
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** Token id this conversation is grounded on, if asset-scoped. */
  assetTokenId?: string;
  createdAt: number;
}

interface ChatState {
  messages: ChatMessage[];
  streaming: boolean;
  addMessage: (m: Omit<ChatMessage, "id" | "createdAt"> & { id?: string }) => string;
  appendToLast: (chunk: string) => void;
  setStreaming: (v: boolean) => void;
  clear: () => void;
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      streaming: false,

      addMessage: (m) => {
        const id = m.id ?? makeId();
        set((s) => ({
          messages: [...s.messages, { ...m, id, createdAt: Date.now() }],
        }));
        return id;
      },

      appendToLast: (chunk) =>
        set((s) => {
          if (s.messages.length === 0) return s;
          const messages = s.messages.slice();
          const last = messages[messages.length - 1];
          messages[messages.length - 1] = { ...last, content: last.content + chunk };
          return { messages };
        }),

      setStreaming: (streaming) => set({ streaming }),

      clear: () => set({ messages: [] }),
    }),
    {
      name: "tagit-chat",
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist transient streaming flag.
      partialize: (s) => ({ messages: s.messages }),
    },
  ),
);
