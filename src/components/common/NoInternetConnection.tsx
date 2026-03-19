import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "../../config/appStyling/colors";
import FontsSize from "../../config/appStyling/fontsSize";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import { useTranslation } from "../../hooks/useTranslation";
import CommonFooter from "./CommonFooter";
import { useNavigationContext } from "../../contexts/NavigationContext";

/**
 * Full-screen component that displays when there's no internet connection
 * Automatically hides when connection is restored with smooth animations
 */
const NoInternetConnection: React.FC = () => {
    const { t } = useTranslation();
    const { activeRouteName } = useNavigationContext();
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pages that should show the footer
    const pagesWithFooter = [
        "GlobalChat",
        "Analyzer",
        "FriendsMain",
        "SettingsMain",
        "PartnerProfiles",
    ];

    const shouldShowFooter = activeRouteName && pagesWithFooter.includes(activeRouteName);

    // Determine active tab based on route name
    const getActiveTab = (): "chat" | "heart" | "file" | "user" | "settings" | undefined => {
        if (!activeRouteName) return undefined;
        if (activeRouteName === "GlobalChat") return "chat";
        if (activeRouteName === "PartnerProfiles") return "heart";
        if (activeRouteName === "Analyzer") return "file";
        if (activeRouteName === "FriendsMain") return "user";
        if (activeRouteName === "SettingsMain") return "settings";
        return undefined;
    };

    // Get footer background color based on route name to match each page's styling
    const getFooterBgColor = (): string => {
        if (!activeRouteName) return colors.WHITE;
        // Settings page uses a light blue/purple background
        if (activeRouteName === "SettingsMain") return "rgba(226, 232, 252)";
        // All other pages use white
        return colors.WHITE;
    };

    useEffect(() => {
        // Fade in animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();

        // Pulsing animation for icon
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        pulseAnimation.start();

        return () => {
            pulseAnimation.stop();
        };
    }, [fadeAnim, scaleAnim, pulseAnim]);

    // Emoji icon component
    const renderConnectionIcon = () => (
        <View style={styles.iconWrapper}>
            <Animated.View
                style={[
                    styles.iconContainer,
                    {
                        transform: [{ scale: pulseAnim }],
                    },
                ]}
            >
                <Text style={styles.icon}>📡</Text>
            </Animated.View>
        </View>
    );

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                },
            ]}
        >
            <LinearGradient
                colors={[colors.WHITE, colors.BACKGROUND]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                <Animated.View
                    style={[
                        styles.content,
                        {
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    {renderConnectionIcon()}
                    <Text style={styles.title}>{t("common.no_internet_title")}</Text>
                    <Text style={styles.message}>{t("common.no_internet_message")}</Text>
                </Animated.View>
                {shouldShowFooter && (
                    <View
                        style={[
                            styles.footerContainer,
                            {
                                backgroundColor: getFooterBgColor(),
                                paddingBottom: insets.bottom,
                            }
                        ]}
                        pointerEvents="none"
                    >
                        <CommonFooter
                            activeTab={getActiveTab()}
                            onChatPress={() => { }}
                            onHeartPress={() => { }}
                            onFilePress={() => { }}
                            onUserPress={() => { }}
                            onSettingsPress={() => { }}
                            bgColor={getFooterBgColor()}
                        />
                    </View>
                )}
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        justifyContent: "center",
        alignItems: "center",
    },
    gradient: {
        flex: 1,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    footerContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
    content: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: Matrics.ms(40),
        maxWidth: Matrics.s(320),
    },
    iconWrapper: {
        marginBottom: Matrics.vs(30),
        alignItems: "center",
        justifyContent: "center",
    },
    iconContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    icon: {
        fontSize: Matrics.ms(80),
        textAlign: "center",
    },
    title: {
        fontSize: FontsSize.SemiLarge,
        fontFamily: typography.fontFamily.Poppins.SemiBold,
        color: colors.TEXT_DARK,
        textAlign: "center",
        marginBottom: Matrics.vs(10),
        lineHeight: Matrics.vs(20),
    },
    message: {
        fontSize: FontsSize.Small,
        fontFamily: typography.fontFamily.Poppins.Regular,
        color: colors.GRAY_DARK,
        textAlign: "center",
        lineHeight: Matrics.vs(20),
        paddingHorizontal: Matrics.ms(0),
    },
});

export default NoInternetConnection;

