import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHistory } from "../hooks/useHistory";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import type { ScanRecord } from "../types/challenge";

function ScanRow({ item }: { item: ScanRecord }) {
  const time = new Date(item.timestamp).toLocaleString();
  const badge = item.verified ? styles.badgeVerified : styles.badgeUnverified;
  const badgeText = item.verified ? "VERIFIED" : "UNVERIFIED";
  const badgeColor = item.verified ? colors.verified : colors.unverified;

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <View style={[styles.badge, { borderColor: badgeColor, backgroundColor: badgeColor + "20" }]}>
          <Text style={[styles.badgeLabel, { color: badgeColor }]}>{badgeText}</Text>
        </View>
        <Text style={styles.elapsed}>{item.elapsedMs}ms</Text>
      </View>

      <View style={styles.rowBody}>
        <Text style={styles.rowToken}>Token #{item.tokenId}</Text>
        <Text style={styles.rowMeta}>
          {item.lifecycleState} · {item.chainName}
        </Text>
        <Text style={styles.rowTime}>{time}</Text>
      </View>
    </View>
  );
}

export function HistoryScreen() {
  const { records, loading, refresh, clear } = useHistory();

  const confirmClear = () =>
    Alert.alert(
      "Clear scan history?",
      "This permanently deletes all saved scans on this device.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: () => void clear() },
      ],
    );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {records.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No scans yet</Text>
          <Text style={styles.emptyHint}>
            Verified scans will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ScanRow item={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {records.length > 0 && (
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={confirmClear}
          activeOpacity={0.7}
        >
          <Text style={styles.clearText}>Clear History</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  list: {
    padding: spacing.lg,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  badgeVerified: {},
  badgeUnverified: {},
  badgeLabel: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  elapsed: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontFamily: "monospace",
  },
  rowBody: {
    gap: 2,
  },
  rowToken: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: "600",
  },
  rowMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  rowTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  separator: {
    height: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  emptyHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  clearBtn: {
    margin: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: "center",
  },
  clearText: {
    fontSize: fontSize.md,
    color: colors.error,
    fontWeight: "600",
  },
});
