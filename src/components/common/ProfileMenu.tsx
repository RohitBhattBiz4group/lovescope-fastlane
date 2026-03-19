import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
} from "react-native";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import useTranslation from "../../hooks/useTranslation";

interface ProfileMenuProps {
    visible: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    menuPosition?: { x: number; y: number };
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({
    visible,
    onClose,
    onEdit,
    onDelete,
    menuPosition,
}) => {
    const { t } = useTranslation();
    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.menuContainer,
                            menuPosition && {
                                position: "absolute",
                                top: menuPosition.y + 5, // Position slightly below the button
                                right: menuPosition.x, // Position from right edge
                            },
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                onEdit();
                                onClose();
                            }}
                        >
                            <Text style={styles.menuItemText}>{t("common.edit")}</Text>
                        </TouchableOpacity>
                        <View style={styles.separator} />
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                onDelete();
                                // Don't call onClose here - let handleDelete handle closing the menu
                            }}
                        >
                            <Text style={[styles.menuItemText, styles.deleteText]}>
                                {t("common.delete")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
    },
    menuContainer: {
        backgroundColor: colors.WHITE,
        borderRadius: Matrics.s(12),
        minWidth: 140,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        overflow: "hidden",
    },
    menuItem: {
        paddingVertical: Matrics.vs(12),
        paddingHorizontal: Matrics.s(16),
    },
    menuItemText: {
        fontSize: FontsSize.Medium,
        fontFamily: typography.fontFamily.Satoshi.Regular,
        color: colors.TEXT_DARK,
    },
    deleteText: {
        color: colors.DANGER || "#FF3B30",
    },
    separator: {
        height: 1,
        backgroundColor: "rgba(31, 31, 31, 0.1)",
    },
});

export default ProfileMenu;

