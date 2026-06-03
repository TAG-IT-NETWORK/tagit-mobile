import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { RootNavigator } from "./src/navigation/RootNavigator";
import {
  WALLETCONNECT_AVAILABLE,
  wagmiConfig,
  queryClient,
  appKit,
  AppKit,
  AppKitProvider,
} from "./src/wallet/appkit";
import { WalletSyncBridge } from "./src/wallet/WalletSyncBridge";
import { colors } from "./src/theme/colors";

const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
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

function AppShell() {
  return (
    <ErrorBoundary>
      <NavigationContainer theme={DarkTheme}>
        <RootNavigator />
      </NavigationContainer>
    </ErrorBoundary>
  );
}

export default function App() {
  // External-wallet support (WalletConnect/AppKit) mounts only when a Reown
  // projectId is configured; otherwise the app runs on the embedded wallet.
  if (WALLETCONNECT_AVAILABLE && wagmiConfig && queryClient && appKit) {
    return (
      <SafeAreaProvider>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <AppKitProvider instance={appKit}>
              <WalletSyncBridge />
              <AppShell />
              <AppKit />
            </AppKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </SafeAreaProvider>
    );
  }
  return (
    <SafeAreaProvider>
      <AppShell />
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
  retryText: { color: colors.text, fontWeight: "700", fontSize: 15 },
});
