/**
 * "Manage" section on the asset page: the owner actions available for this
 * asset (rules.ts), a banner for a scheduled recycle (with cancel), and the
 * owner's recent actions. Renders nothing for a non-owner. Refreshes on focus
 * so the state is right after coming back from the confirm screen.
 */
import React, { useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useOwnerActionsFeed, useSaleState } from "../owner-actions/hooks";
import { availableActions } from "../owner-actions/rules";
import { ACTION_COPY } from "../owner-actions/copy";
import type { OwnerActionKind } from "../owner-actions/message";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";

interface Props {
  tokenId: string;
  stateCode: number;
  owner: string;
  activeAddress: string | null;
  onAction: (action: OwnerActionKind) => void;
}

const STATUS_LABEL: Record<string, string> = {
  executed: "Done",
  scheduled: "Scheduled",
  cancelled: "Cancelled",
  failed: "Failed",
};

export function OwnerActionsPanel({ tokenId, stateCode, owner, activeAddress, onAction }: Props) {
  const isOwner = !!activeAddress && owner.toLowerCase() === activeAddress.toLowerCase();
  const feed = useOwnerActionsFeed(tokenId, isOwner ? activeAddress : null);
  const sale = useSaleState(tokenId);

  useFocusEffect(
    useCallback(() => {
      void feed.reload();
      void sale.reload();
    }, [feed.reload, sale.reload]),
  );

  if (!isOwner) return null;

  const actions = availableActions({
    stateCode,
    isOwner,
    saleState: sale.saleState,
    pendingRecycle: feed.pendingRecycle !== null,
  });
  const recent = feed.actions.slice(0, 3);
  if (actions.length === 0 && recent.length === 0) return null;

  const pending = feed.pendingRecycle;
  const when = pending?.executeAt ? new Date(pending.executeAt).toLocaleString() : null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Manage</Text>

      {sale.saleState === "listed" && sale.display ? (
        <View style={styles.infoRow}>
          <Ionicons name="pricetag" size={16} color={colors.primary} />
          <Text style={styles.infoText}>Listed for sale at {sale.display}</Text>
        </View>
      ) : null}

      {pending ? (
        <View style={styles.banner}>
          <Ionicons name="time-outline" size={18} color={colors.warning} />
          <Text style={styles.bannerText}>Recycling scheduled{when ? ` for ${when}` : ""}. Cancel below to keep the asset.</Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        {actions.map((a) => {
          const c = ACTION_COPY[a];
          const tone = c.tone === "warning" ? colors.warning : c.tone === "success" ? colors.success : c.tone === "primary" ? colors.primary : colors.text;
          return (
            <Pressable key={a} onPress={() => onAction(a)} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}>
              <Ionicons name={c.icon} size={20} color={tone} />
              <View style={{ flex: 1 }}>
                <Text style={styles.btnTitle}>{c.title}</Text>
                <Text style={styles.btnHint}>{c.hint}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          );
        })}
      </View>

      {recent.length > 0 ? (
        <View style={styles.history}>
          {recent.map((r) => (
            <View key={r.id} style={styles.historyRow}>
              <Text style={styles.historyAction}>{ACTION_COPY[r.action]?.title ?? r.action}</Text>
              <Text style={[styles.historyStatus, r.status === "failed" && { color: colors.error }]}>
                {STATUS_LABEL[r.status] ?? r.status} · {new Date(r.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: "700", marginBottom: spacing.md },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.sm },
  infoText: { color: colors.textSecondary, fontSize: fontSize.md },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.warningDim,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  bannerText: { color: colors.text, fontSize: fontSize.sm, flex: 1 },
  grid: { gap: spacing.sm },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  btnTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: "700" },
  btnHint: { color: colors.textMuted, fontSize: fontSize.sm },
  history: { marginTop: spacing.md, gap: spacing.xs },
  historyRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  historyAction: { color: colors.textSecondary, fontSize: fontSize.sm },
  historyStatus: { color: colors.textMuted, fontSize: fontSize.sm },
});
