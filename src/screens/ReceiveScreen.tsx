import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import QRCode from "react-native-qrcode-svg";
import { useWallet } from "../wallet/useWallet";
import { buildReceivePayload } from "../wallet/receive";
import { DEV_OWNER } from "../config/env";
import { colors } from "../theme/colors";
import { spacing, radius, fontSize } from "../theme/spacing";
import type { ProfileStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<ProfileStackParamList, "Receive">;

export function ReceiveScreen(_props: Props) {
  const { activeAddress } = useWallet();
  const payload = buildReceivePayload(activeAddress);
  const [copied, setCopied] = useState(false);
  const { width } = useWindowDimensions();
  // QR must stay comfortably scannable but never overflow small screens:
  // content padding (24×2) + card quiet-zone padding (24×2) + border (1×2).
  const qrSize = Math.min(width - spacing.lg * 4 - 2, 260);

  const copyAddress = async () => {
    if (!payload) return;
    await Clipboard.setStringAsync(payload);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // A DEV_OWNER demo build shows someone ELSE's assets in the Vault while the
  // device wallet is a different address — soliciting deposits in that state
  // would strand the user ("my asset never arrived"). Same rule as Transfer:
  // no Receive while demo data is active.
  if (DEV_OWNER) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Receive is off in demo mode</Text>
        <Text style={styles.hint}>
          The Vault is showing demo assets that don't belong to this device's wallet, so
          receiving is disabled to avoid confusion.
        </Text>
      </View>
    );
  }

  if (!payload) {
    // Distinguish "no wallet" from "wallet address failed validation" — the
    // latter must never be papered over with onboarding guidance.
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>
          {activeAddress ? "Address unavailable" : "No wallet yet"}
        </Text>
        <Text style={styles.hint}>
          {activeAddress
            ? "This wallet's address failed a safety check and can't be shown. Please contact support."
            : "Create your wallet in the Vault tab first."}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.qrCard}>
        <QRCode value={payload} size={qrSize} color={colors.text} backgroundColor="#FFFFFF" />
      </View>

      <Text style={styles.label}>Your wallet address</Text>
      <Text style={styles.address} selectable>
        {payload}
      </Text>

      <TouchableOpacity
        onPress={copyAddress}
        style={styles.copyBtn}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Copy wallet address"
      >
        <Ionicons
          name={copied ? "checkmark" : "copy-outline"}
          size={18}
          color={colors.textInverse}
        />
        <Text style={styles.copyText}>{copied ? "Copied" : "Copy address"}</Text>
      </TouchableOpacity>

      <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.noticeText}>
          Scan the code or share the address to receive TAG IT assets and gas ETH. This wallet is
          on Base Sepolia — only send Base Sepolia assets to it.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, alignItems: "center", gap: spacing.md },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: "600" },
  hint: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.sm },
  // White card with a hairline border doubles as the QR quiet zone — 24pt
  // padding keeps ≥4 modules of quiet zone at the 260pt QR size.
  qrCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  address: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  copyText: { color: colors.textInverse, fontSize: fontSize.md, fontWeight: "700" },
  notice: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  noticeText: { flex: 1, color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
});
