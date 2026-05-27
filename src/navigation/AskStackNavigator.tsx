import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ChatScreen } from "../screens/ChatScreen";
import { colors } from "../theme/colors";
import type { AskStackParamList } from "./types";

const Stack = createNativeStackNavigator<AskStackParamList>();

export function AskStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: "Ask" }}
      />
    </Stack.Navigator>
  );
}
