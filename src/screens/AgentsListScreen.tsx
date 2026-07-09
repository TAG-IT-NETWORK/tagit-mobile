import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useAgents } from "../agents/useAgents";
import type { AgentSummary } from "../agents/types";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import type { AgentsStackParamList } from "../navigation/types";

const DASHBOARD_AGENTS_URL = "https://admin.tagit.network/agents";

type Nav = NativeStackNavigationProp<AgentsStackParamList, "AgentsList">;

function AgentCard({ agent, onPress }: { agent: AgentSummary; onPress: () => void }) {
  const skillCount = agent.skills?.length ?? 0;
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${agent.name} agent`}
    >
      <View style={styles.cardIcon}>
        <Ionicons name="hardware-chip-outline" size={22} color={colors.primary} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>{agent.name}</Text>
          <View style={styles.typePill}>
            <Text style={styles.typePillText}>{agent.type}</Text>
          </View>
        </View>
        {agent.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {agent.description}
          </Text>
        ) : null}
        <Text style={styles.cardMeta}>
          {skillCount} {skillCount === 1 ? "skill" : "skills"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export function AgentsListScreen() {
  const nav = useNavigation<Nav>();
  const { agents, loading, error, refresh } = useAgents();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        data={agents}
        keyExtractor={(a) => String(a.agentId)}
        renderItem={({ item }) => (
          <AgentCard agent={item} onPress={() => nav.navigate("AgentDetail", { agent: item })} />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.intro}>
            <Text style={styles.title}>Network Agents</Text>
            <Text style={styles.subtitle}>The AI agents powering TAG IT verification</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Ionicons name="cloud-offline-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity onPress={refresh} activeOpacity={0.7}>
                <Text style={styles.retry}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No agents found</Text>
            </View>
          )
        }
        ListFooterComponent={
          agents.length > 0 ? (
            <TouchableOpacity
              style={styles.deployBtn}
              onPress={() => Linking.openURL(DASHBOARD_AGENTS_URL)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Ionicons name="rocket-outline" size={18} color={colors.primary} />
              <Text style={styles.deployText}>Deploy an agent on the dashboard</Text>
              <Ionicons name="open-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg },
  intro: { marginBottom: spacing.md, gap: 2 },
  title: { fontSize: fontSize.xxl, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 3 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardName: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  typePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.full,
    backgroundColor: colors.primaryDim + "33",
    borderWidth: 1,
    borderColor: colors.primaryDim,
  },
  typePillText: { fontSize: fontSize.xs, color: colors.accent, fontWeight: "700", textTransform: "uppercase" },
  cardDesc: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  cardMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  sep: { height: spacing.sm },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: "center" },
  retry: { fontSize: fontSize.sm, color: colors.primary, fontWeight: "700" },
  deployBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  deployText: { fontSize: fontSize.sm, color: colors.text, fontWeight: "600" },
});
