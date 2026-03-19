import React, { ReactNode, useRef, useState } from "react";
import { TouchableOpacity, Text, StyleProp, ViewStyle, TextStyle, ActivityIndicator, View, Animated, Platform } from "react-native";
import colors from "../../config/appStyling/colors";
import { commonStyles } from "./styles";

interface ButtonProps {
    title?: string;
    onPress?: () => void;
    disabled?: boolean;
    loading?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    variant?: "primary" | "secondary" | "outline";
    loaderColor?: string;
}

const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    disabled = false,
    loading = false,
    containerStyle,
    textStyle,
    leftIcon,
    rightIcon,
    variant = "primary",
    loaderColor,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [isPressed, setIsPressed] = useState(false);

    const getButtonStyle = () => {
        switch (variant) {
            case "secondary":
                return [commonStyles.buttonPrimary, { backgroundColor: "#6c757d" }];
            case "outline":
                return [
                    commonStyles.buttonPrimary,
                    {
                        backgroundColor: "transparent",
                        borderWidth: 1,
                        borderColor: "#000",
                    },
                ];
            default:
                return commonStyles.buttonPrimary;
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case "outline":
                return [commonStyles.buttonText, { color: "#000" }];
            default:
                return commonStyles.buttonText;
        }
    };

    const handlePressIn = () => {
        setIsPressed(true);
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            friction: Platform.OS === "ios" ? 4 : 8,
            tension: Platform.OS === "ios" ? 100 : 200,
            useNativeDriver: true,
            velocity: Platform.OS === "ios" ? 0.3 : undefined,
        }).start();
    };

    const handlePressOut = () => {
        setIsPressed(false);
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: Platform.OS === "ios" ? 3 : 5,
            tension: Platform.OS === "ios" ? 150 : 300,
            useNativeDriver: true,
            velocity: Platform.OS === "ios" ? 0.4 : undefined,
        }).start();
    };

    const animatedButtonStyle = {
        transform: [{ scale: scaleAnim }],
    };

    const handlePress = () => {
        if (!disabled && !loading && onPress) {
            onPress();
        }
    };

    return (
        <Animated.View style={animatedButtonStyle}>
            <TouchableOpacity
                style={[getButtonStyle(), disabled && commonStyles.buttonDisabled, isPressed && { opacity: 0.9 }, containerStyle]}
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                delayPressIn={0}
                disabled={disabled || loading}
                activeOpacity={1}
            >
                {loading ? (
                    <ActivityIndicator color={loaderColor || colors.WHITE} />
                ) : (
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {leftIcon && <View style={{ marginRight: 10 }}>{leftIcon}</View>}
                        {title && <Text style={[getTextStyle(), textStyle]}>{title}</Text>}
                        {rightIcon && <View style={{ marginLeft: 10 }}>{rightIcon}</View>}
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

export default Button;

