import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAsk } from "../chat/useAsk";
import { useAssetDetail } from "../vault/useVault";
import { ChatBubble } from "../components/ChatBubble";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import type { AskAssetContext } from "../services/ask";
import type { AskStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AskStackParamList, "Chat">;

const SUGGESTIONS = [
  "What is this asset?",
  "Who owned it before me?",
  "What does its current state mean?",
];

export function ChatScreen({ route }: Props) {
  const assetTokenId = route.params?.assetTokenId;
  // When opened from an asset, fetch its facts to ground the conversation.
  const { asset } = useAssetDetail(assetTokenId ?? "");

  const assetContext: AskAssetContext | undefined = useMemo(() => {
    if (!assetTokenId || !asset) return undefined;
    return {
      tokenId: asset.tokenId,
      lifecycleState: asset.lifecycleState,
      owner: asset.owner,
      name: asset.name,
      description: asset.description,
      tagHash: asset.tagHash,
      attributes: asset.attributes,
      provenance: asset.provenance?.map((p) => ({ label: p.label, timestamp: p.timestamp })),
    };
  }, [assetTokenId, asset]);

  const { messages, streaming, send } = useAsk(assetContext);
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) listRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const onSend = (text: string) => {
    if (!text.trim() || streaming) return;
    send(text);
    setInput("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {messages.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="sparkles-outline" size={40} color={colors.primary} />
          <Text style={styles.emptyTitle}>
            {assetTokenId ? `Ask about asset #${assetTokenId}` : "Ask Sage about your assets"}
          </Text>
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <Pressable key={s} style={styles.chip} onPress={() => onSend(s)}>
                <Text style={styles.chipText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <ChatBubble
              message={item}
              streaming={streaming && index === messages.length - 1}
            />
          )}
        />
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask anything…"
          placeholderTextColor={colors.textMuted}
          multiline
          onSubmitEditing={() => onSend(input)}
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || streaming) && styles.sendDisabled]}
          onPress={() => onSend(input)}
          disabled={!input.trim() || streaming}
        >
          <Ionicons name="arrow-up" size={20} color={colors.textInverse} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: "700",
    marginTop: spacing.md,
    textAlign: "center",
  },
  suggestions: { marginTop: spacing.lg, gap: spacing.sm, width: "100%" },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  chipText: { color: colors.textSecondary, fontSize: fontSize.md },
  list: { padding: spacing.md },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    maxHeight: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.lg,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.4 },
});
