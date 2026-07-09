import React, { useRef } from "react";
import {
  Pressable,
  View,
  Animated,
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
 * The prominent center "Tap" button — an elevated violet circle that floats
 * above the tab bar. Used as the Tap tab's custom tabBarButton. Springs down
 * on press for tactile feedback.
 */
export function TabBarTapButton({ onPress, focused }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const springTo = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 8 }).start();

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={() => springTo(0.88)}
          onPressOut={() => springTo(1)}
          accessibilityRole="button"
          accessibilityLabel="Tap to verify"
          style={[styles.button, focused && styles.buttonFocused]}
        >
          <Ionicons name="scan" size={30} color={colors.textInverse} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const SIZE = 66;

const styles = StyleSheet.create({
  wrap: {
    top: -22,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: colors.bg,
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  buttonFocused: {
    backgroundColor: colors.primary,
  },
});
