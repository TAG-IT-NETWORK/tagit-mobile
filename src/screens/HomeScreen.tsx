import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { ScanButton } from "../components/ScanButton";
import { ErrorBanner } from "../components/ErrorBanner";
import { useVerify } from "../hooks/useVerify";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

export function HomeScreen() {
  const nav = useNavigation<Nav>();
  const {
    phase,
    nfcStatus,
    result,
    sunData,
    challenge,
    error,
    startScan,
    startDemo,
    cancel,
    reset,
  } = useVerify();

  const [tokenInput, setTokenInput] = useState("");
  const [demoMode, setDemoMode] = useState(false);

  const tokenIdOverride = tokenInput ? parseInt(tokenInput, 10) || undefined : undefined;

  // Navigate to result when verification completes
  useEffect(() => {
    if (phase === "done" && result) {
      Haptics.notificationAsync(
        result.verified
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
      nav.navigate("Result", { result, sunData, challenge });
      // Reset after navigation so we can scan again
      const timer = setTimeout(reset, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, result, sunData, challenge, nav, reset]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (phase === "scanning" || phase === "health-check" || phase === "challenging") {
      cancel();
      return;
    }
    if (demoMode) {
      startDemo(tokenIdOverride);
    } else {
      startScan(tokenIdOverride);
    }
  }, [phase, demoMode, tokenIdOverride, cancel, startDemo, startScan]);

  const nfcUnavailable = nfcStatus === "unsupported" && !demoMode;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/icon.png")}
          style={styles.logoMark}
          resizeMode="contain"
          accessibilityLabel="TAG IT logo"
        />
        <Text style={styles.logo}>TAG IT</Text>
        <Text style={styles.subtitle}>NFC Verification</Text>
      </View>

      {/* Scan Button */}
      <View style={styles.scanArea}>
        <ScanButton
          phase={phase}
          onPress={handlePress}
          disabled={nfcUnavailable}
        />
        {phase === "health-check" && (
          <Text style={styles.hint}>Checking server...</Text>
        )}
        {phase === "challenging" && (
          <Text style={styles.hint}>Generating challenge nonce...</Text>
        )}
        {phase === "scanning" && (
          <Text style={styles.hint}>Hold phone near NFC chip...</Text>
        )}
        {phase === "idle" && nfcStatus === "unsupported" && !demoMode && (
          <Text style={styles.hintWarn}>NFC is not available on this device.</Text>
        )}
      </View>

      {/* Error */}
      {error && (
        <View style={styles.section}>
          <ErrorBanner message={error} onDismiss={reset} />
        </View>
      )}

      {/* Dev-only controls (token override + demo mode). Hidden in release
          builds — consumers just tap to scan. */}
      {__DEV__ && (
        <>
          <View style={styles.section}>
            <Text style={styles.inputLabel}>Token ID (dev override)</Text>
            <TextInput
              style={styles.input}
              value={tokenInput}
              onChangeText={setTokenInput}
              placeholder="e.g. 1"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              returnKeyType="done"
            />
          </View>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Demo Mode (dev)</Text>
              <Text style={styles.toggleDesc}>Verify a sample item without a chip</Text>
            </View>
            <Switch
              value={demoMode}
              onValueChange={setDemoMode}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.bg}
            />
          </View>
        </>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => nav.navigate("History")}
          activeOpacity={0.7}
        >
          <Text style={styles.historyLink}>View History</Text>
        </TouchableOpacity>
        <View style={styles.netBadge}>
          <View style={styles.baseLogo} />
          <Text style={styles.netBadgeText}>Powered by Base</Text>
          <Text style={styles.netBadgeSub}>· Testnet</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: "center",
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  logoMark: {
    width: 60,
    height: 60,
    borderRadius: 15,
    marginBottom: spacing.sm,
  },
  logo: {
    fontSize: fontSize.hero,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scanArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  hintWarn: {
    fontSize: fontSize.sm,
    color: colors.warning,
  },
  section: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md,
    color: colors.text,
    fontFamily: "monospace",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  toggleLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: "600",
  },
  toggleDesc: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  footer: {
    alignItems: "center",
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  netBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  baseLogo: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#0052FF", // Base brand blue
  },
  netBadgeText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  netBadgeSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: "600",
  },
  historyLink: {
    fontSize: fontSize.md,
    color: colors.accent,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
