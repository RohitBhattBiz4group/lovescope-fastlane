import React from "react";
import { StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import colors from "../config/appStyling/colors";
import Matrics from "../config/appStyling/matrics";

const ConversationHistorySkeleton: React.FC = () => {
    const gradientProps = {
        colors: [colors.GRAY_LIGHT, colors.BACKGROUND, colors.GRAY_MEDIUM],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
    };

    const renderRow = (key: number) => (
        <View key={key} style={styles.rowContainer}>
            <LinearGradient {...gradientProps} style={styles.iconSkeleton} />

            <View style={styles.textSkeletonContainer}>
                <LinearGradient {...gradientProps} style={styles.titleSkeleton} />
                <LinearGradient {...gradientProps} style={styles.subtitleSkeleton} />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {Array.from({ length: 15 }).map((_, index) => renderRow(index))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Matrics.s(16),
        paddingBottom: Matrics.vs(20),
    },
    rowContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: Matrics.vs(8),
    },
    iconSkeleton: {
        width: Matrics.s(20),
        height: Matrics.s(20),
        borderRadius: Matrics.s(10),
        marginRight: Matrics.s(12),
    },
    textSkeletonContainer: {
        flex: 1,
    },
    titleSkeleton: {
        width: "80%",
        height: Matrics.vs(12),
        borderRadius: Matrics.s(4),
        marginBottom: Matrics.vs(6),
    },
    subtitleSkeleton: {
        width: "60%",
        height: Matrics.vs(10),
        borderRadius: Matrics.s(4),
    },
});

export default ConversationHistorySkeleton;
