import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "@react-native-community/blur";
import useTranslation from "../../hooks/useTranslation";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ConfirmationModalProps {
  visible?: boolean;
  title: string;
  message: string;
  onYesPress?: () => void;
  onNoPress?: () => void;
  loading?: boolean;
  disable?: boolean;
  cancelText?: string;
  confirmText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  onYesPress,
  onNoPress,
  loading = false,
  disable = false,
  cancelText,
  confirmText,
}) => {
  const { t } = useTranslation();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalContainer}>
        {/* Backdrop with blur effect */}
        <TouchableWithoutFeedback onPress={onNoPress}>
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
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                (disable || loading) && { opacity: 0.6 },
              ]}
              onPress={onYesPress}
              disabled={disable || loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.WHITE} />
              ) : (
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  {confirmText || t("common.confirm")}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onNoPress}
              disabled={disable}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                {cancelText || t("common.cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blurView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.10)",
  },
  modalContent: {
    backgroundColor: colors.WHITE,
    borderTopLeftRadius: Matrics.s(24),
    borderTopRightRadius: Matrics.s(24),
    paddingHorizontal: Matrics.s(20),
    paddingTop: Matrics.vs(20),
    paddingBottom: Matrics.vs(20),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    textAlign: "center",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(10),
  },
  message: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Matrics.vs(20),
    paddingHorizontal: Matrics.s(10),
  },
  actionsContainer: {
    flexDirection: "row",
    gap: Matrics.s(12),
  },
  button: {
    flex: 1,
    borderRadius: Matrics.s(30),
    paddingVertical: Matrics.vs(12),
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: colors.PRIMARY,
  },
  primaryButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.WHITE,
    lineHeight: 16,
  },
  secondaryButton: {
    backgroundColor: colors.WHITE,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  secondaryButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.TEXT_PRIMARY,
  },
  buttonText: {
    lineHeight: Matrics.vs(18),
  },
});

export default ConfirmationModal;
