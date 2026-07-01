import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAssetDetail } from "../vault/useVault";
import { ProvenanceTimeline } from "../components/ProvenanceTimeline";
import { stateColor, stateLabel } from "../vault/lifecycle";
import { shortenAddress, shortenHash } from "../config/constants";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import type { VaultStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<VaultStackParamList, "AssetDetail">;

export function VaultDetailScreen({ route, navigation }: Props) {
  const { tokenId } = route.params;
  const { asset, loading, error } = useAssetDetail(tokenId);

  // Jump to the Ask tab, grounded on this asset (cross-navigator hop).
  const askAboutThis = () => {
    const parent = navigation.getParent() as unknown as
      | { navigate: (name: string, params?: object) => void }
      | undefined;
    parent?.navigate("Ask", { screen: "Chat", params: { assetTokenId: tokenId } });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (error || !asset) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? "Asset not found"}</Text>
      </View>
    );
  }

  const badge = stateColor(asset.stateCode);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        {asset.image ? (
          <Image source={{ uri: asset.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <Ionicons name="cube-outline" size={64} color={colors.textMuted} />
        )}
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>{asset.name ?? `Asset #${asset.tokenId}`}</Text>
        <View style={[styles.badge, { backgroundColor: badge + "22", borderColor: badge }]}>
          <Text style={[styles.badgeText, { color: badge }]}>{stateLabel(asset.stateCode)}</Text>
        </View>
      </View>

      {asset.description ? <Text style={styles.description}>{asset.description}</Text> : null}

      <Pressable
        onPress={askAboutThis}
        style={({ pressed }) => [styles.askBtn, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="sparkles" size={18} color={colors.text} />
        <Text style={styles.askText}>Ask about this asset</Text>
      </Pressable>

      <View style={styles.facts}>
        <Fact label="Token ID" value={`#${asset.tokenId}`} />
        <Fact label="Owner" value={shortenAddress(asset.owner)} />
        {asset.tagHash ? <Fact label="NFC tag" value={shortenHash(asset.tagHash)} /> : null}
      </View>

      {asset.attributes && asset.attributes.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attributes</Text>
          <View style={styles.attrs}>
            {asset.attributes.map((a, i) => (
              <View key={`${a.trait_type}-${i}`} style={styles.attr}>
                <Text style={styles.attrType}>{a.trait_type}</Text>
                <Text style={styles.attrValue}>{String(a.value)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Provenance</Text>
        <ProvenanceTimeline events={asset.provenance} />
      </View>
    </ScrollView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  error: { color: colors.error, fontSize: fontSize.md },
  hero: {
    aspectRatio: 1,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: "800", flex: 1 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeText: { fontSize: fontSize.sm, fontWeight: "700" },
  description: { color: colors.textSecondary, fontSize: fontSize.md, marginTop: spacing.sm },
  askBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primaryDim,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  askText: { color: colors.text, fontSize: fontSize.md, fontWeight: "700" },
  facts: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  fact: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  factLabel: { color: colors.textMuted, fontSize: fontSize.md },
  factValue: { color: colors.text, fontSize: fontSize.md, fontWeight: "600" },
  section: { marginTop: spacing.xl },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  attrs: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  attr: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  attrType: { color: colors.textMuted, fontSize: fontSize.xs, textTransform: "uppercase" },
  attrValue: { color: colors.text, fontSize: fontSize.md, fontWeight: "600" },
});
