import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useWallet } from "../wallet/useWallet";
import { useOwnedAssets } from "../vault/useVault";
import { AssetCard } from "../components/AssetCard";
import { WalletPill } from "../components/WalletPill";
import { OnboardingScreen } from "./OnboardingScreen";
import { DEV_OWNER } from "../config/env";
import { colors } from "../theme/colors";
import { spacing, fontSize } from "../theme/spacing";
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

  return (
    <FlatList
      data={assets}
      keyExtractor={(a) => a.tokenId}
      numColumns={2}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
      }
      renderItem={({ item }) => (
        <AssetCard
          asset={item}
          onPress={() => navigation.navigate("AssetDetail", { tokenId: item.tokenId })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  list: { padding: spacing.sm, backgroundColor: colors.bg },
  empty: { color: colors.text, fontSize: fontSize.lg, fontWeight: "600" },
  error: { color: colors.error, fontSize: fontSize.md, textAlign: "center" },
  hint: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.sm },
});
