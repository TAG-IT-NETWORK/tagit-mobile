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
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import type { RootStackParamList } from "../navigation/types";

type ResultNav = NativeStackNavigationProp<RootStackParamList, "Result">;
type ResultRoute = RouteProp<RootStackParamList, "Result">;

export function ResultScreen() {
  const nav = useNavigation<ResultNav>();
  const route = useRoute<ResultRoute>();
  const { result, challenge, sunData } = route.params;

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
  scanAgainBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  scanAgainText: {
    fontSize: fontSize.lg,
    color: colors.text,
    fontWeight: "700",
  },
});
