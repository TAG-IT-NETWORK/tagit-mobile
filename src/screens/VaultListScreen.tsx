import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useWallet } from "../wallet/useWallet";
import { useOwnedAssets } from "../vault/useVault";
import { availableStates, filterAssets, type StateFilter } from "../vault/filter";
import { AssetCard } from "../components/AssetCard";
import { WalletPill } from "../components/WalletPill";
import { OnboardingScreen } from "./OnboardingScreen";
import { DEV_OWNER } from "../config/env";
import { STATE_DISPLAY_NAMES } from "../config/constants";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import type { VaultStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<VaultStackParamList, "VaultList">;

export function VaultListScreen({ navigation }: Props) {
  const { activeAddress, createEmbedded, connect, walletConnectAvailable, restore, restored, status, error: walletError } =
    useWallet();

  // Restore a previously-created wallet on first mount (once per mount; the
  // Vault tab stays mounted for the app's lifetime under the bottom-tab
  // navigator). A failed restore keeps restored=false and surfaces retry —
  // it must NOT fall through to onboarding (key-overwrite race, SEC model).
  useEffect(() => {
    if (!restored && status !== "connecting") void restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the active wallet visible in the header.
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <WalletPill address={activeAddress} />,
    });
  }, [navigation, activeAddress]);

  // Dev override: query a known holder so the Vault is populated for demos.
  const queryAddress = DEV_OWNER || activeAddress;
  const { assets, loading, error, refresh } = useOwnedAssets(queryAddress);

  // Client-side search + state filter over the fetched list.
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("ALL");
  const filtered = useMemo(
    () => filterAssets(assets, query, stateFilter),
    [assets, query, stateFilter],
  );
  const chipStates = useMemo(() => availableStates(assets), [assets]);
  // A selected state can disappear from the list (e.g. the last CLAIMED asset
  // was transferred away) — fall back to ALL instead of a stuck-empty vault.
  useEffect(() => {
    if (stateFilter !== "ALL" && !chipStates.includes(stateFilter)) setStateFilter("ALL");
  }, [chipStates, stateFilter]);

  // Re-query when returning to the Vault (e.g. after a transfer) so a
  // just-sent asset drops out of the list without a manual pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  if (!activeAddress && !DEV_OWNER) {
    // Keystore read failed: offer retry, never onboarding — "Create my wallet"
    // over an unread existing key would overwrite it permanently.
    if (!restored && status === "error") {
      return (
        <View style={styles.center}>
          <Text style={styles.error}>{walletError ?? "Could not read the device keystore."}</Text>
          <Text style={styles.hint} onPress={() => void restore()}>
            Tap to retry
          </Text>
        </View>
      );
    }
    // Restore still in flight: hold on a spinner until we know whether a
    // wallet exists.
    if (!restored) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    return (
      <OnboardingScreen
        onCreateEmbedded={createEmbedded}
        onConnectExternal={walletConnectAvailable ? connect : undefined}
      />
    );
  }

  if (loading && assets.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error && assets.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Text style={styles.hint} onPress={refresh}>
          Tap to retry
        </Text>
      </View>
    );
  }

  if (assets.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No assets yet.</Text>
        <Text style={styles.hint}>Tap an item's TAG IT chip to claim it.</Text>
      </View>
    );
  }

  const clearFilters = () => {
    setQuery("");
    setStateFilter("ALL");
  };

  return (
    <View style={styles.screen}>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search name or #id"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search assets"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={14} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {chipStates.length >= 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.chipsRow}
          contentContainerStyle={styles.chipsContent}
        >
          {(["ALL", ...chipStates] as StateFilter[]).map((s) => {
            const selected = stateFilter === s;
            return (
              <Pressable
                key={s}
                onPress={() => setStateFilter(s)}
                style={[styles.chip, selected && styles.chipSelected]}
                hitSlop={{ top: 4, bottom: 4 }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {s === "ALL" ? "All" : STATE_DISPLAY_NAMES[s]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.tokenId}
        numColumns={2}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.noMatches}>
            <Text style={styles.empty}>No matching assets.</Text>
            <Pressable onPress={clearFilters} hitSlop={8} accessibilityRole="button">
              <Text style={styles.hint}>Clear search & filters</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <AssetCard
            asset={item}
            onPress={() => navigation.navigate("AssetDetail", { tokenId: item.tokenId })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    // Align with the card grid edge: list padding (8) + card margin (4).
    marginHorizontal: spacing.sm + spacing.xs,
    marginTop: spacing.md,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.sm + 2,
  },
  chipsRow: { flexGrow: 0, marginTop: spacing.sm },
  chipsContent: { paddingHorizontal: spacing.sm + spacing.xs, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 36,
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: "600" },
  chipTextSelected: { color: colors.accent, fontWeight: "700" },
  list: { padding: spacing.sm, backgroundColor: colors.bg, flexGrow: 1 },
  noMatches: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  empty: { color: colors.text, fontSize: fontSize.lg, fontWeight: "600" },
  error: { color: colors.error, fontSize: fontSize.md, textAlign: "center" },
  hint: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.sm },
});
