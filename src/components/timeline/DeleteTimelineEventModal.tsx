import React, { useEffect, useRef, useState } from "react";
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

interface DeleteTimelineEventModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    loading?: boolean;
}

const DeleteTimelineEventModal: React.FC<DeleteTimelineEventModalProps> = ({
    visible,
    onClose,
    onConfirm,
    loading = false,
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

    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        if (isDeleting) return;

        setIsDeleting(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error("Error in delete confirmation:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalContainer}
            >
                {/* Backdrop with blur effect */}
                <TouchableWithoutFeedback onPress={onClose} disabled={loading || isDeleting}>
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
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.spacer} />
                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>{t("timeline.delete")}</Text>
                        </View>
                       
                    </View>

                    {/* Confirmation Message */}
                    <View style={styles.messageContainer}>
                        <Text style={styles.messageText}>
                            {t("timeline.delete_confirmation")}
                        </Text>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <View style={styles.buttonWrapper}>
                            <Button
                                title={t("common.confirm")}
                                onPress={handleConfirm}
                                loading={isDeleting || loading}
                                disabled={isDeleting || loading}
                                containerStyle={styles.confirmButton}
                            />
                        </View>
                        <View style={styles.buttonWrapper}>
                            <Button
                                title={t("common.cancel")}
                                onPress={onClose}
                                disabled={isDeleting || loading}
                                variant="outline"
                                containerStyle={styles.cancelButton}
                                textStyle={styles.cancelButtonText}
                            />
                        </View>
                    </View>
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
        maxHeight: SCREEN_HEIGHT * 0.5,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: Matrics.vs(20),
        position: "relative",
    },
    spacer: {
        width: Matrics.s(20), // Same width as close button to balance layout
    },
    titleContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 0,
    },
    title: {
        fontSize: FontsSize.Regular,
        fontFamily: typography.fontFamily.Poppins.SemiBold,
        fontWeight: "600",
        color: colors.TEXT_PRIMARY,
        textAlign: "center",
    },
    closeButton: {
        padding: Matrics.s(1),
        zIndex: 1,
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
    messageContainer: {
        marginBottom: Matrics.vs(30),
        alignItems: "center",
    },
    messageText: {
        fontSize: FontsSize.Medium,
        fontFamily: typography.fontFamily.Poppins.Regular,
        color: colors.TEXT_PRIMARY,
        textAlign: "center",
        lineHeight: Matrics.vs(22),
        fontWeight: "500",
    },
    buttonContainer: {
        flexDirection: "row",
        gap: Matrics.s(16),
        width: "100%",
        marginBottom: Matrics.vs(10),
    },
    buttonWrapper: {
        flex: 1,
    },
    confirmButton: {
        backgroundColor: colors.PRIMARY,
        borderRadius: 999, // Fully rounded pill shape
        height: Matrics.vs(52),
        justifyContent: "center",
        alignItems: "center",
    },
    cancelButton: {
        backgroundColor: colors.WHITE,
        borderWidth: 1,
        borderColor: colors.BLACK,
        borderRadius: 999, // Fully rounded pill shape
        height: Matrics.vs(52),
        justifyContent: "center",
        alignItems: "center",
    },
    cancelButtonText: {
        color: colors.BLACK,
    },
});

export default DeleteTimelineEventModal;
