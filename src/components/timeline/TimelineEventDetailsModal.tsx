import React, { useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Image,
    ScrollView,
} from "react-native";
import { BlurView } from "@react-native-community/blur";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import useTranslation from "../../hooks/useTranslation";
import Button from "../common/Button";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface TimelineEvent {
    id: number | string;
    title: string;
    date: string;
    description?: string | null;
    unclear_date?: boolean;
}

interface TimelineEventDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    event: TimelineEvent | null;
    onEdit: () => void;
    onDelete: () => void;
}

const TimelineEventDetailsModal: React.FC<TimelineEventDetailsModalProps> = ({
    visible,
    onClose,
    event,
    onEdit,
    onDelete,
}) => {
    const { t } = useTranslation();
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Animate modal sliding up
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Animate modal sliding down
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: SCREEN_HEIGHT,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, slideAnim, backdropOpacity]);

    const formatDate = (dateString: string): string => {
        try {
            // Handle YYYY-MM-DD format
            let date: Date;
            if (dateString.includes("-") && dateString.length === 10) {
                const [year, month, day] = dateString.split("-").map(Number);
                date = new Date(year, month - 1, day);
            } else {
                date = new Date(dateString);
            }

            if (isNaN(date.getTime())) {
                return dateString;
            }

            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        } catch {
            return dateString;
        }
    };

    if (!visible || !event) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalContainer}
            >
                {/* Backdrop with blur effect */}
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View
                        style={[styles.backdrop, { opacity: backdropOpacity }]}
                    >
                        <BlurView
                            style={styles.blurView}
                            blurType="light"
                            blurAmount={20}
                            reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.10)"
                        />
                        <View style={styles.blurOverlay} />
                    </Animated.View>
                </TouchableWithoutFeedback>

                {/* Modal Content */}
                <Animated.View
                    style={[
                        styles.modalContent,
                        { transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>{t("timeline.title")}</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={onClose}
                            >
                                <View style={styles.closeIconContainer}>
                                    <Image
                                        source={Images.CLOSE_ICON}
                                        style={styles.closeIcon}
                                        resizeMode="contain"
                                    />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Event Title */}
                        <View style={styles.contentContainer}>
                            <Image
                                source={Images.TOP_RIGHT_GRADIENT}
                                style={styles.gradientOverlayTopRight}
                                resizeMode="cover"
                            />
                            <Image
                                source={Images.TOP_RIGHT_GRADIENT}
                                style={styles.gradientOverlay}
                                resizeMode="cover"
                            />
                            <Text style={styles.eventTitle}>{event.title}</Text>

                            {/* Date */}
                            <View style={styles.dateContainer}>
                                <Text style={styles.dateLabel}>{t("timeline.event_date")}</Text>
                                <Text style={styles.dateValue}>{formatDate(event.date)}</Text>
                                {event.unclear_date && (
                                    <View style={styles.unclearDateNote}>
                                        <Text style={styles.unclearDateText}>
                                            {t("timeline.unclear_date_message")}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Summary */}
                            <View style={styles.summaryContainer}>
                                <Text style={styles.summaryLabel}>{t("timeline.summary")}</Text>
                                <Text style={styles.summaryText}>
                                    {event.description || t("timeline.no_summary")}
                                </Text>
                            </View>
                        </View>

                        {/* Buttons */}
                        <View style={styles.buttonContainer}>
                            <View style={styles.buttonWrapper}>
                                <Button
                                    title={t("common.edit")}
                                    onPress={onEdit}
                                    containerStyle={styles.editButton}
                                />
                            </View>
                            <View style={styles.buttonWrapper}>
                                <Button
                                    title={t("common.delete")}
                                    onPress={onDelete}
                                    variant="outline"
                                    containerStyle={styles.deleteButton}
                                    textStyle={styles.deleteButtonText}
                                />
                            </View>
                        </View>
                    </ScrollView>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    blurView: {
        ...StyleSheet.absoluteFillObject,
    },
    blurOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 255, 255, 0.10)",
    },
    modalContent: {
        backgroundColor: colors.WHITE,
        borderTopLeftRadius: Matrics.s(30),
        borderTopRightRadius: Matrics.s(30),
        paddingTop: Matrics.vs(20),
        paddingHorizontal: Matrics.s(20),
        paddingBottom: Matrics.vs(30),
        maxHeight: SCREEN_HEIGHT * 0.85,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: Matrics.vs(20),
    },
    title: {
        fontSize: FontsSize.Regular,
        fontFamily: typography.fontFamily.Poppins.SemiBold,
        fontWeight: "600",
        color: colors.TEXT_PRIMARY,
    },
    closeButton: {
        padding: Matrics.s(1),
    },
    closeIconContainer: {
        width: Matrics.s(20),
        height: Matrics.s(20),
        alignItems: "center",
        justifyContent: "center",
    },
    closeIcon: {
        width: "100%",
        height: "100%",
    },
    contentContainer: {
        marginBottom: Matrics.vs(30),
        borderWidth: 1,
        borderColor: "#2F59EB33",
        borderRadius: Matrics.s(12),
        padding: Matrics.s(16),
        position: "relative",
        overflow: "hidden",
    },
    gradientOverlayTopRight: {
        position: "absolute",
        top: 0,
        right: 0,
        width: Matrics.s(130),
        height: Matrics.vs(130),
        overflow: "hidden",
        borderTopRightRadius: Matrics.s(12),
    },
    gradientOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        width: Matrics.s(100),
        height: Matrics.vs(100),
        overflow: "hidden",
        borderBottomLeftRadius: Matrics.s(12),
        transform: [{ scaleX: -1 }, { scaleY: -1 }], // Flip both horizontally and vertically to fit bottom-left
    },
    eventTitle: {
        fontSize: FontsSize.Medium,
        fontFamily: typography.fontFamily.Poppins.SemiBold,
        fontWeight: "600",
        color: colors.TEXT_PRIMARY,
        marginBottom: Matrics.vs(8),
    },
    dateContainer: {
        marginBottom: Matrics.vs(20),
    },
    dateLabel: {
        fontSize: FontsSize.Small,
        fontFamily: typography.fontFamily.Poppins.Regular,
        color: colors.TEXT_PRIMARY || "#9CA3AF",
        marginBottom: Matrics.vs(4),
    },
    dateValue: {
        fontSize: FontsSize.Medium,
        fontFamily: typography.fontFamily.Poppins.Regular,
        color: colors.TEXT_DARK,
        fontWeight: "500",
    },
    unclearDateNote: {
        marginTop: Matrics.vs(8),
        paddingHorizontal: Matrics.s(12),
        paddingVertical: Matrics.vs(8),
        backgroundColor: "rgba(255, 193, 7, 0.1)", // Light yellow/amber background
        borderRadius: Matrics.s(8),
        borderLeftWidth: 3,
        borderLeftColor: colors.SECONDARY || "#9CA3AF",
    },
    unclearDateText: {
        fontSize: FontsSize.Small,
        fontFamily: typography.fontFamily.Poppins.Regular,
        color: colors.TEXT_PRIMARY,
        lineHeight: Matrics.vs(15),
    },
    summaryContainer: {
        backgroundColor: "#2F59EB0D", // Light gray background
        borderRadius: Matrics.s(10),
        padding: Matrics.s(16),
        borderWidth: 1,
        borderColor: "#2F59EB33",
    },
    summaryLabel: {
        fontSize: FontsSize.Small,
        fontFamily: typography.fontFamily.Poppins.Medium,
        fontWeight: "500",
        color: colors.PRIMARY,
        marginBottom: Matrics.vs(4),
    },
    summaryText: {
        fontSize: FontsSize.Medium,
        fontFamily: typography.fontFamily.Poppins.Regular,
        color: colors.TEXT_PRIMARY,
        lineHeight: Matrics.vs(17),
        fontWeight: "500",
    },
    buttonContainer: {
        flexDirection: "row",
        gap: Matrics.s(16),
        marginBottom: Matrics.vs(10),
        width: "100%",
    },
    buttonWrapper: {
        flex: 1,
    },
    editButton: {
        backgroundColor: colors.PRIMARY,
        borderRadius: 999, // Fully rounded pill shape
        height: Matrics.vs(52),
        justifyContent: "center",
        alignItems: "center",
    },
    deleteButton: {
        backgroundColor: colors.WHITE,
        borderWidth: 1,
        borderColor: colors.BLACK,
        borderRadius: 999, // Fully rounded pill shape
        height: Matrics.vs(52),
        justifyContent: "center",
        alignItems: "center",
    },
    deleteButtonText: {
        color: colors.BLACK,
    },
});

export default TimelineEventDetailsModal;
