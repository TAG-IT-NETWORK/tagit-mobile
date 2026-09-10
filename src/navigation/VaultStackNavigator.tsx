import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { VaultListScreen } from "../screens/VaultListScreen";
import { VaultDetailScreen } from "../screens/VaultDetailScreen";
import { TransferScreen } from "../screens/TransferScreen";
import { OwnerActionScreen } from "../screens/OwnerActionScreen";
import { ACTION_COPY } from "../owner-actions/copy";
import { colors } from "../theme/colors";
import type { VaultStackParamList } from "./types";

const Stack = createNativeStackNavigator<VaultStackParamList>();

export function VaultStackNavigator() {
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
      <Stack.Screen
        name="VaultList"
        component={VaultListScreen}
        options={{ title: "Vault" }}
      />
      <Stack.Screen
        name="AssetDetail"
        component={VaultDetailScreen}
        options={{ title: "Asset" }}
      />
      <Stack.Screen
        name="Transfer"
        component={TransferScreen}
        options={{ title: "Send asset" }}
      />
      <Stack.Screen
        name="OwnerAction"
        component={OwnerActionScreen}
        options={({ route }) => ({ title: ACTION_COPY[route.params.action].title })}
      />
    </Stack.Navigator>
  );
}
