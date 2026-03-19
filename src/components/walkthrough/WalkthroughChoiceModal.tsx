import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import useTranslation from "../../hooks/useTranslation";

interface WalkthroughChoiceModalProps {
  visible: boolean;
  message: string;
  onContinueChat: () => void;
  onContinueTour: () => void;
}

const WalkthroughChoiceModal: React.FC<WalkthroughChoiceModalProps> = ({
  visible,
  message,
  onContinueChat,
  onContinueTour,
}) => {
  const { t } = useTranslation();

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.messageText}>{message}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onContinueChat}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>
                {t("walkthrough.profile_chat.continue_chat")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onContinueTour}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {t("walkthrough.profile_chat.continue_tour")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Matrics.s(24),
  },
  card: {
    backgroundColor: colors.WHITE,
    borderRadius: Matrics.s(16),
    paddingVertical: Matrics.vs(20),
    paddingHorizontal: Matrics.s(20),
    shadowColor: colors.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: Matrics.s(340),
    width: "100%",
  },
  messageText: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(22),
    marginBottom: Matrics.vs(20),
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Matrics.s(12),
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(25),
    paddingVertical: Matrics.vs(12),
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.WHITE,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.WHITE,
    borderRadius: Matrics.s(25),
    paddingVertical: Matrics.vs(12),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.PRIMARY,
  },
  secondaryButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.PRIMARY,
  },
});

export default WalkthroughChoiceModal;
