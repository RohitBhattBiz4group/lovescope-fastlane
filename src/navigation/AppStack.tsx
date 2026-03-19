import React from "react";
import { ImageBackground, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BottomTabNavigator from "./TabStack";
import Images from "../config/Images";
import OnboardingStackNavigator from "./OnboardingStackNavigator";
import useAuth from "../hooks/useAuth";

const Stack = createNativeStackNavigator();

const AppStack: React.FC = () => {

  const { authData, appLoading } = useAuth();
  const hasCompletedOnboarding = !!authData?.user?.has_completed_onboarding;

  if (appLoading) return null;

  return (
    <Stack.Navigator
      key={hasCompletedOnboarding ? "main" : "onboarding"}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
        animation: "fade",
      }}
      initialRouteName={hasCompletedOnboarding ? "MainStack" : "Onboarding"}
    >
      <Stack.Screen name="Onboarding" component={OnboardingStackNavigator} />
      <Stack.Screen name="MainStack" component={BottomTabNavigator} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AppStack;
