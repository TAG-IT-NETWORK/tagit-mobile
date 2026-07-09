import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput as RNTextInput } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { colors } from "./src/theme/colors";

// Honor iOS "Larger Text" up to +40% without breaking fixed-height chrome.
// Drop to 1.3 if the ScanButton ring overflows at the max setting on device.
const DYNAMIC_TYPE_CAP = 1.4;
const TextDefaults = (Text as unknown as { defaultProps?: Record<string, unknown> });
TextDefaults.defaultProps = { ...TextDefaults.defaultProps, allowFontScaling: true, maxFontSizeMultiplier: DYNAMIC_TYPE_CAP };
const InputDefaults = (RNTextInput as unknown as { defaultProps?: Record<string, unknown> });
InputDefaults.defaultProps = { ...InputDefaults.defaultProps, maxFontSizeMultiplier: DYNAMIC_TYPE_CAP };

const LightTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

/** Catches render crashes app-wide and shows a branded fallback (not a blank screen). */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.fallback}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>{this.state.message || "An unexpected error occurred."}</Text>
        <TouchableOpacity
          style={styles.retry}
          onPress={() => this.setState({ hasError: false, message: "" })}
          activeOpacity={0.8}
        >
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ErrorBoundary>
        <NavigationContainer theme={LightTheme}>
          <RootNavigator />
        </NavigationContainer>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: "700" },
  body: { color: colors.textSecondary, fontSize: 14, textAlign: "center" },
  retry: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: colors.textInverse, fontWeight: "700", fontSize: 15 },
});
