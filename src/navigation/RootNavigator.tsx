import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TapStackNavigator } from "./TapStackNavigator";
import { VaultStackNavigator } from "./VaultStackNavigator";
import { AskStackNavigator } from "./AskStackNavigator";
import { AgentsStackNavigator } from "./AgentsStackNavigator";
import { ProfileStackNavigator } from "./ProfileStackNavigator";
import { TabBarTapButton } from "../components/TabBarTapButton";
import { colors } from "../theme/colors";
import type { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICON = 28;
const BAR_CONTENT = 60; // icon + label area above the home-indicator inset

/**
 * Root bottom-tab navigator. The verify flow lives inside the center Tap tab.
 * Order keeps Tap centered: Vault · Agents · [Tap] · Ask · Profile.
 * Profile (wallet + settings) replaces the old dead Market placeholder and
 * makes Settings reachable from every tab. Bar height tracks the safe-area
 * inset so labels never crowd the home indicator.
 */
export function RootNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: BAR_CONTENT + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom - 2 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontSize: 13, fontWeight: "600", marginTop: 2 },
        tabBarIconStyle: { marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="Vault"
        component={VaultStackNavigator}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="cube-outline" size={TAB_ICON} color={color} />,
        }}
      />
      <Tab.Screen
        name="Agents"
        component={AgentsStackNavigator}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="hardware-chip-outline" size={TAB_ICON} color={color} />
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
        name="Ask"
        component={AskStackNavigator}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="sparkles-outline" size={TAB_ICON} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={TAB_ICON} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
