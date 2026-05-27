import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { TapStackNavigator } from "./TapStackNavigator";
import { VaultStackNavigator } from "./VaultStackNavigator";
import { AskStackNavigator } from "./AskStackNavigator";
import { PlaceholderScreen } from "../screens/PlaceholderScreen";
import { TabBarTapButton } from "../components/TabBarTapButton";
import { colors } from "../theme/colors";
import type { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

function MarketScreen() {
  return <PlaceholderScreen title="Marketplace" subtitle="Verified trade — coming soon" icon="storefront-outline" />;
}

function AgentsScreen() {
  return <PlaceholderScreen title="Agents" subtitle="Deploy AI agents — coming soon" icon="hardware-chip-outline" />;
}

/**
 * Root bottom-tab navigator. The original verify flow lives unchanged inside
 * the center Tap tab (TapStackNavigator). Market & Agents are placeholders for
 * later phases; Vault & Ask host their own stacks.
 */
export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="Vault"
        component={VaultStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Market"
        component={MarketScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tap"
        component={TapStackNavigator}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => (
            <TabBarTapButton
              focused={props.accessibilityState?.selected ?? false}
              onPress={props.onPress}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Agents"
        component={AgentsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hardware-chip-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Ask"
        component={AskStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
