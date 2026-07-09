import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { spacing, fontSize } from "../theme/spacing";
import { formatTimestamp } from "../config/constants";
import type { ProvenanceEvent } from "../vault/types";

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  AssetMinted: "sparkles",
  TagBound: "link",
  StateChanged: "swap-horizontal",
  Transfer: "arrow-forward",
};

interface Props {
  events: ProvenanceEvent[];
}

/** Vertical provenance timeline (oldest → newest). */
export function ProvenanceTimeline({ events }: Props) {
  if (events.length === 0) {
    return <Text style={styles.empty}>No history available yet.</Text>;
  }
  return (
    <View>
      {events.map((e, i) => (
        <View key={`${e.txHash}-${i}`} style={styles.row}>
          <View style={styles.gutter}>
            <View style={styles.dot}>
              <Ionicons name={ICONS[e.type] ?? "ellipse"} size={16} color={colors.textInverse} />
            </View>
            {i < events.length - 1 && <View style={styles.line} />}
          </View>
          <View style={styles.body}>
            <Text style={styles.label}>{e.label}</Text>
            <Text style={styles.meta}>
              {e.timestamp ? formatTimestamp(e.timestamp) : `Block ${e.blockNumber}`}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textMuted, fontSize: fontSize.sm, fontStyle: "italic" },
  row: { flexDirection: "row" },
  gutter: { width: 32, alignItems: "center" },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  body: { flex: 1, paddingBottom: spacing.lg, paddingLeft: spacing.sm },
  label: { color: colors.text, fontSize: fontSize.md, fontWeight: "600" },
  meta: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
});
