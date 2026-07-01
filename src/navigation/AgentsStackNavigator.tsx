import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AgentsListScreen } from "../screens/AgentsListScreen";
import { AgentDetailScreen } from "../screens/AgentDetailScreen";
import { colors } from "../theme/colors";
import type { AgentsStackParamList } from "./types";

const Stack = createNativeStackNavigator<AgentsStackParamList>();

export function AgentsStackNavigator() {
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
      <Stack.Screen name="AgentsList" component={AgentsListScreen} options={{ title: "Agents" }} />
      <Stack.Screen name="AgentDetail" component={AgentDetailScreen} options={{ title: "Agent" }} />
    </Stack.Navigator>
  );
}
