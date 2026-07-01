import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useWallet } from "../wallet/useWallet";
import { useHistory } from "../hooks/useHistory";
import { API_URL, VERIFIER_URL } from "../config/env";
import { BASE_SEPOLIA_CHAIN_ID } from "../onchain/addresses";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";

function shorten(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

function host(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

const appVersion = Constants.expoConfig?.version ?? "0.1.0";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  icon,
  onPress,
  destructive,
  first,
}: {
  label: string;
  value?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  destructive?: boolean;
  first?: boolean;
}) {
  const color = destructive ? colors.error : colors.text;
  const body = (
    <View style={[styles.row, !first && styles.rowBorder]}>
      {icon && (
        <Ionicons name={icon} size={18} color={destructive ? colors.error : colors.textSecondary} />
      )}
      <Text style={[styles.rowLabel, { color }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value !== undefined && <Text style={styles.rowValue}>{value}</Text>}
        {onPress && !destructive && (
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        )}
      </View>
    </View>
  );
  if (!onPress) return body;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button">
      {body}
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  const { activeAddress, mode, forget } = useWallet();
  const { clear: clearHistory } = useHistory();

  const confirmForget = () =>
    Alert.alert(
      "Forget wallet?",
      "This removes the on-device wallet key. If you haven't backed it up, any assets it holds become unrecoverable.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Forget", style: "destructive", onPress: () => void forget() },
      ],
    );

  const confirmClearHistory = () =>
    Alert.alert("Clear scan history?", "This permanently deletes all saved scans on this device.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => void clearHistory() },
    ]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Wallet">
          <Row
            first
            icon="wallet-outline"
            label="Address"
            value={activeAddress ? shorten(activeAddress) : "No wallet"}
          />
          {activeAddress && (
            <Row icon="information-circle-outline" label="Type" value={mode === "connected" ? "Connected" : "On-device"} />
          )}
          {activeAddress && (
            <Row icon="trash-outline" label="Forget wallet" destructive onPress={confirmForget} />
          )}
        </Section>

        <Section title="Network">
          <Row first icon="link-outline" label="Chain" value={`Base Sepolia (${BASE_SEPOLIA_CHAIN_ID})`} />
          <Row icon="shield-checkmark-outline" label="Verifier" value={host(VERIFIER_URL)} />
          <Row icon="server-outline" label="Backend" value={host(API_URL)} />
        </Section>

        <Section title="Data">
          <Row first icon="trash-outline" label="Clear scan history" destructive onPress={confirmClearHistory} />
        </Section>

        <Section title="About">
          <Row first icon="pricetag-outline" label="App" value="TAG IT" />
          <Row icon="cube-outline" label="Version" value={appVersion} />
          <Row icon="globe-outline" label="Verification" value="ERC-8004" />
        </Section>

        <Text style={styles.tagline}>TAG IT — verify what&apos;s real.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rowLabel: { flex: 1, fontSize: fontSize.md, color: colors.text },
  rowRight: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  rowValue: { fontSize: fontSize.sm, color: colors.textSecondary, fontFamily: "monospace" },
  tagline: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
  },
});
