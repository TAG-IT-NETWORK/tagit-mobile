import React from "react";
import {
  Pressable,
  View,
  StyleSheet,
  type GestureResponderEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

interface Props {
  onPress?: (e: GestureResponderEvent) => void;
  focused: boolean;
}

/**
 * The prominent center "Tap" button — an elevated purple circle that floats
 * above the tab bar. Used as the Tap tab's custom tabBarButton.
 */
export function TabBarTapButton({ onPress, focused }: Props) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Tap to verify"
        style={({ pressed }) => [
          styles.button,
          focused && styles.buttonFocused,
          pressed && styles.buttonPressed,
        ]}
      >
        <Ionicons name="scan" size={28} color={colors.text} />
      </Pressable>
    </View>
  );
}

const SIZE = 60;

const styles = StyleSheet.create({
  wrap: {
    top: -18,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: colors.bg,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  buttonFocused: {
    backgroundColor: colors.primaryDim,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
