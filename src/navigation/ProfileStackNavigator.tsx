import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SettingsScreen } from "../screens/SettingsScreen";
import { colors } from "../theme/colors";
import type { ProfileStackParamList } from "./types";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

/**
 * Profile tab — the app-wide home for wallet + settings, reachable from every
 * tab (replaces the former dead "Market" placeholder). Hosts SettingsScreen.
 */
export function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: colors.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Profile" component={SettingsScreen} options={{ title: "Profile" }} />
    </Stack.Navigator>
  );
}
