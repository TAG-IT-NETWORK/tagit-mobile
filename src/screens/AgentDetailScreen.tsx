import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import type { AgentsStackParamList } from "../navigation/types";

const DASHBOARD_AGENTS_URL = "https://admin.tagit.network/agents";

type DetailRoute = RouteProp<AgentsStackParamList, "AgentDetail">;

export function AgentDetailScreen() {
  const { agent } = useRoute<DetailRoute>().params;
  const skills = agent.skills ?? [];

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="hardware-chip-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.name}>{agent.name}</Text>
          <View style={styles.typePill}>
            <Text style={styles.typePillText}>{agent.type}</Text>
          </View>
        </View>

        {agent.description ? <Text style={styles.description}>{agent.description}</Text> : null}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Capabilities</Text>
            {skills.map((s) => (
              <View key={s.id} style={styles.skill}>
                <Text style={styles.skillName}>{s.name}</Text>
                {s.description ? <Text style={styles.skillDesc}>{s.description}</Text> : null}
                {s.tags && s.tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {s.tags.map((t) => (
                      <View key={t} style={styles.tag}>
                        <Text style={styles.tagText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.deployBtn}
          onPress={() => Linking.openURL(DASHBOARD_AGENTS_URL)}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Ionicons name="rocket-outline" size={18} color={colors.primary} />
          <Text style={styles.deployText}>Manage &amp; deploy on the dashboard</Text>
          <Ionicons name="open-outline" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.netBadge}>
          <View style={styles.netDot} />
          <Text style={styles.netBadgeText}>ERC-8004 · Base Sepolia · Testnet</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  hero: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: fontSize.xxl, fontWeight: "800", color: colors.text },
  typePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.primaryDim + "33",
    borderWidth: 1,
    borderColor: colors.primaryDim,
  },
  typePillText: { fontSize: 11, color: colors.primary, fontWeight: "700", textTransform: "uppercase" },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: "center",
  },
  section: { gap: spacing.sm, marginTop: spacing.sm },
  sectionTitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  skill: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  skillName: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  skillDesc: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 18 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: 2 },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceLight,
  },
  tagText: { fontSize: 10, color: colors.textMuted, fontWeight: "600" },
  deployBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  deployText: { fontSize: fontSize.sm, color: colors.text, fontWeight: "600" },
  netBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  netDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning },
  netBadgeText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: "600" },
});
