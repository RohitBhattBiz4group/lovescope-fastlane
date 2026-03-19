import "react-native-gesture-handler";
// Initialize Sentry as early as possible
import { initSentry } from "./src/utils/sentry";
// Initialize i18n before any other imports
import "./src/localization/i18n";
import { useEffect, useState } from "react";
import { Platform, Dimensions } from "react-native";
import { StatusBar, StyleSheet, useColorScheme } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { CopilotProvider } from "react-native-copilot";

import { store } from "./src/stateManagement/store";
import { CustomTooltip, HiddenStepNumber } from "./src/components/walkthrough";
import AuthInitializer from "./src/components/auth/AuthInitializer";
import Router from "./src/navigation/Router";
import Toast from "react-native-toast-message";
import { toastConfig } from "./src/components/common/CustomToastConfig";
import SplashScreen from "react-native-splash-screen";
import { APP } from "./src/constants/commonConstant";
import { useNetworkStatus } from "./src/hooks/useNetworkStatus";
import NoInternetConnection from "./src/components/common/NoInternetConnection";
import { NavigationProvider } from "./src/contexts/NavigationContext";
import { WalkthroughProvider, useWalkthroughConfig } from "./src/contexts/WalkthroughContext";

// Initialize Sentry for error tracking and performance monitoring
initSentry();

function App() {
    useEffect(() => {
        SplashScreen.hide();
    }, []);

    return (
        <WalkthroughProvider>
            <CopilotWrapper />
        </WalkthroughProvider>
    );
}

function CopilotWrapper() {
    const isDarkMode = useColorScheme() === "dark";
    const { stopOnOutsideClick } = useWalkthroughConfig();
    const [screenSize, setScreenSize] = useState(Dimensions.get('window'));

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setScreenSize(window);
        });
        return () => subscription?.remove();
    }, []);

    // Responsive configuration based on screen size
    const getResponsiveConfig = () => {
        const { width, height } = screenSize;
        const isSmallScreen = width < 375; // iPhone SE and similar
        const isMediumScreen = width >= 375 && width < 768; // Most phones
        const isLargeScreen = width >= 768; // Tablets and larger

        return {
            tooltipWidth: isSmallScreen ? width - 32 : isMediumScreen ? width - 48 : Math.min(width - 96, 400),
            fontSize: isSmallScreen ? 14 : isMediumScreen ? 16 : 18,
            buttonPadding: isSmallScreen ? 10 : isMediumScreen ? 12 : 14,
        } as {
            tooltipWidth: number;
            fontSize: number;
            buttonPadding: number;
        };
    };

    const responsiveConfig = getResponsiveConfig();

    return (
        <CopilotProvider
            overlay="svg"
            backdropColor="rgba(0, 0, 0, 0.6)"
            arrowColor="#2F59EB"
            animated={false}
            stopOnOutsideClick={stopOnOutsideClick}
            tooltipComponent={(props) => <CustomTooltip {...props} responsiveConfig={responsiveConfig} />}
            stepNumberComponent={HiddenStepNumber}
            verticalOffset={0}
        >
            <SafeAreaProvider>
                <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
                <NavigationProvider>
                    <AppContent />
                </NavigationProvider>
            </SafeAreaProvider>
        </CopilotProvider>
    );
}

function AppContent() {
    const { isConnected } = useNetworkStatus();

    return (
        <SafeAreaView style={styles.container} edges={Platform.OS === APP.ANDROID ? ['bottom', 'left', 'right', 'top'] : ['left', 'right', 'top']}>
            <Provider store={store}>
                <AuthInitializer>
                    <Router />
                    <Toast config={toastConfig} />
                </AuthInitializer>
            </Provider>
            {isConnected === false && <NoInternetConnection />}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
});

export default App;

