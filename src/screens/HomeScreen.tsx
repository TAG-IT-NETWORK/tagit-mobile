import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
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
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>ORACULAR</Text>
        <Text style={styles.subtitle}>TAG IT NFC Verification</Text>
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
          <Text style={styles.hintWarn}>NFC not available — enable Demo Mode</Text>
        )}
      </View>

      {/* Error */}
      {error && (
        <View style={styles.section}>
          <ErrorBanner message={error} onDismiss={reset} />
        </View>
      )}

      {/* Token ID Input */}
      <View style={styles.section}>
        <Text style={styles.inputLabel}>Token ID (optional override)</Text>
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

      {/* Demo Mode Toggle */}
      <View style={styles.toggleRow}>
        <View>
          <Text style={styles.toggleLabel}>Demo Mode</Text>
          <Text style={styles.toggleDesc}>
            Bypass NFC with hardcoded payload
          </Text>
        </View>
        <Switch
          value={demoMode}
          onValueChange={setDemoMode}
          trackColor={{ false: colors.border, true: colors.primaryDim }}
          thumbColor={demoMode ? colors.primary : colors.textMuted}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => nav.navigate("History")}
          activeOpacity={0.7}
        >
          <Text style={styles.historyLink}>View History</Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>
          Powered by ERC-8004 on Arbitrum Sepolia
        </Text>
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
  historyLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
