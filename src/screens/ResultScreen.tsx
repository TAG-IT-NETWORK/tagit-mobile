import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { StatusIndicator } from "../components/StatusIndicator";
import { ChallengeCard } from "../components/ChallengeCard";
import { NfcDataCard } from "../components/NfcDataCard";
import { AssetStateCard } from "../components/AssetStateCard";
import { ProofCard } from "../components/ProofCard";
import { ChainBadge } from "../components/ChainBadge";
import { AssetImage } from "../components/AssetImage";
import { resultThumbUri } from "../vault/display";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import type { RootStackParamList } from "../navigation/types";

type ResultNav = NativeStackNavigationProp<RootStackParamList, "Result">;
type ResultRoute = RouteProp<RootStackParamList, "Result">;

export function ResultScreen() {
  const nav = useNavigation<ResultNav>();
  const route = useRoute<ResultRoute>();
  const { result, challenge, sunData } = route.params;

  // Product identity from the verify response (META-T38 mapped these through;
  // older responses omit them → the card is skipped and the layout is
  // unchanged).
  const { name, brand, image } = result.asset;
  const hasProduct = Boolean(name || brand || image);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Verified / Unverified */}
        <StatusIndicator verified={result.verified} />

        {/* Performance badge */}
        <View style={styles.perfBadge}>
          <Text style={styles.perfText}>
            Verified in {result.elapsedMs}ms
          </Text>
        </View>

        {/* What was tapped: thumb + name + brand (verify product fields) */}
        {hasProduct && (
          <View style={styles.productCard}>
            <View style={styles.productThumbWrap}>
              <AssetImage
                uri={resultThumbUri(image)}
                recyclingKey={result.asset.tokenId}
                style={styles.productThumb}
                fallbackIconSize={28}
              />
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {name ?? `Asset #${result.asset.tokenId}`}
              </Text>
              {brand ? (
                <Text style={styles.productBrand} numberOfLines={1}>
                  {brand}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {/* Chain */}
        <ChainBadge chainId={result.chain.id} chainName={result.chain.name} />

        {/* Challenge */}
        {challenge && <ChallengeCard challenge={challenge} />}

        {/* NFC Tag Data */}
        {sunData && <NfcDataCard sunData={sunData} />}

        {/* Asset Info */}
        <AssetStateCard
          lifecycleState={result.asset.lifecycleState}
          stateCode={result.asset.stateCode}
          owner={result.asset.owner}
          timestamp={result.asset.timestamp}
          tokenId={result.asset.tokenId}
        />

        {/* Oracle Proof */}
        <ProofCard
          signature={result.proof.signature}
          messageHash={result.proof.messageHash}
          oracleAddress={result.proof.oracleAddress}
          counter={result.proof.counter}
          timestamp={result.proof.timestamp}
        />

        {/* Scan Another */}
        <TouchableOpacity
          style={styles.scanAgainBtn}
          onPress={() => nav.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.scanAgainText}>Scan Another</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  perfBadge: {
    alignSelf: "center",
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  perfText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  productThumbWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  productThumb: { width: "100%", height: "100%" },
  productInfo: { flex: 1 },
  productName: { color: colors.text, fontSize: fontSize.md, fontWeight: "700" },
  productBrand: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  scanAgainBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  scanAgainText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
});
