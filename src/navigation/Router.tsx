import React, { useCallback, useRef } from "react";
import {
  NavigationContainer,
  NavigationContainerRef,
  NavigationState,
  getStateFromPath,
} from "@react-navigation/native";

import { RootStackParamList } from "../interfaces/navigationTypes";
import "react-native-gesture-handler";

import useAuth from "../hooks/useAuth";
import AppStack from "./AppStack";
import AuthStack from "./AuthStack";
import { useNavigationContext } from "../contexts/NavigationContext";

const linking = {
  prefixes: ["lovescope://", "https://lovescope.app"],
  config: {
    screens: {
      MainStack: {
        screens: {
          UserTab: {
            screens: {
              FriendsMain: {
                path: "", // This matches the root https://lovescope.app
              },
            },
          },
        },
      },
      Login: "login",
    },
  },
  // We use this to manually catch the query params if standard config fails
  getStateFromPath: (path: string, options: unknown) => {
    const url = new URL(path, 'https://lovescope.app');

    // If it's the root path or /join, send to FriendsMain
    if (url) {
      return {
        routes: [{
          name: "MainStack",
          state: {
            routes: [{
              name: "UserTab",
              state: {
                routes: [{
                  name: "FriendsMain",
                  params: { initialTab: "requests" }
                }]
              }
            }]
          }
        }]
      };
    }
    return getStateFromPath(path, options as any);
  }
};

const Router: React.FC = () => {
  const { authData, appLoading } = useAuth();
  const { setActiveRouteName } = useNavigationContext();

  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  const getActiveRouteName = useCallback((state: NavigationState | undefined) => {
    const getActiveRoute = (navState: NavigationState | Record<string, unknown> | undefined): { name?: string } | undefined => {
      if (!navState || !("routes" in navState) || !("index" in navState)) return navState as { name?: string } | undefined;
      const routes = navState.routes as Array<{ state?: NavigationState; name?: string }>;
      const index = navState.index as number;
      const route = routes[index];
      if (route?.state) return getActiveRoute(route.state);
      return route;
    };

    const activeRoute = getActiveRoute(state);
    return activeRoute?.name;
  }, []);

  const handleStateChange = useCallback(
    (state?: NavigationState) => {
      const routeName = getActiveRouteName(state);
      setActiveRouteName(routeName);
    },
    [getActiveRouteName, setActiveRouteName]
  );

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={() => {
        const state = navigationRef.current?.getRootState?.();
        const routeName = getActiveRouteName(state);
        setActiveRouteName(routeName);
      }}
      onStateChange={handleStateChange}
    >
      {!appLoading ? (
        authData ? (
          // Render AppStack if authData is available
          <AppStack />
        ) : (
          // Render AuthStack if authData is not available
          <AuthStack />
        )
      ) : // Display SplashScreen while the application is loading
        null}
    </NavigationContainer>
  );
};

export default Router;

