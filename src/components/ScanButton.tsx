import React, { useEffect, useRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Easing,
  View,
} from "react-native";
import { colors } from "../theme/colors";
import { fontSize, radius } from "../theme/spacing";
import type { VerifyPhase } from "../hooks/useVerify";

interface ScanButtonProps {
  phase: VerifyPhase;
  onPress: () => void;
  disabled?: boolean;
}

export function ScanButton({ phase, onPress, disabled }: ScanButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const isActive =
    phase === "health-check" ||
    phase === "challenging" ||
    phase === "scanning" ||
    phase === "verifying";

  useEffect(() => {
    if (phase === "scanning") {
      // Pulse animation while scanning
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else if (phase === "health-check" || phase === "challenging" || phase === "verifying") {
      // Spin animation while verifying
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [phase, pulseAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const label =
    phase === "health-check"
      ? "Checking..."
      : phase === "challenging"
        ? "Preparing..."
        : phase === "scanning"
          ? "Scanning..."
          : phase === "verifying"
            ? "Verifying..."
            : "Tap to Scan";

  return (
    <Animated.View
      style={[
        styles.outerRing,
        { transform: [{ scale: pulseAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          isActive && styles.buttonActive,
          disabled && styles.buttonDisabled,
        ]}
        onPress={onPress}
        disabled={disabled || isActive}
        activeOpacity={0.7}
      >
        {phase === "health-check" || phase === "challenging" || phase === "verifying" ? (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Text style={styles.icon}>{"◎"}</Text>
          </Animated.View>
        ) : (
          <View>
            <Text style={styles.icon}>
              {phase === "scanning" ? "📡" : "⬡"}
            </Text>
          </View>
        )}
        <Text style={[styles.label, isActive && styles.labelActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const BUTTON_SIZE = 180;

const styles = StyleSheet.create({
  outerRing: {
    width: BUTTON_SIZE + 24,
    height: BUTTON_SIZE + 24,
    borderRadius: (BUTTON_SIZE + 24) / 2,
    borderWidth: 2,
    borderColor: colors.primary + "40",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonActive: {
    borderColor: colors.warning,
    backgroundColor: colors.surfaceLight,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: fontSize.hero + 8,
    textAlign: "center",
    color: colors.text,
  },
  label: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 8,
    fontWeight: "600",
  },
  labelActive: {
    color: colors.warning,
  },
});
