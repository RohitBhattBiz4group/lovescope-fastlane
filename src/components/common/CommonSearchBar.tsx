import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  StyleProp,
  ViewStyle,
} from "react-native";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import useTranslation from "../../hooks/useTranslation";
interface CommonSearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onSearchPress?: () => void;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

const CommonSearchBar: React.FC<CommonSearchBarProps> = ({
  placeholder,
  value,
  onChangeText,
  onFocus,
  onSearchPress,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const placeholderText = placeholder ?? t("common.search_profile_placeholder");

  return (
    <View style={[styles.container, disabled && styles.containerDisabled]}>
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        placeholder={placeholderText}
        placeholderTextColor={
          disabled ? colors.TEXT_SECONDARY : "rgba(31, 31, 31, 0.6)"
        }
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        onFocus={onFocus}
      />
      <View style={styles.searchButton}>
        <Image
          source={Images.SEARCH_ICON}
          style={[styles.searchIcon, disabled && styles.searchIconDisabled]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 26, 26, 0.08)",
    borderRadius: Matrics.s(14),
    paddingHorizontal: Matrics.s(14),
    paddingVertical: Matrics.vs(7),
    // marginHorizontal: Matrics.s(20),
    marginTop: Matrics.vs(16),
    shadowColor: "rgba(228, 229, 231, 0.24)",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.TEXT_DARK,
    padding: 0,
  },
  searchButton: {
    padding: Matrics.s(4),
  },
  searchIcon: {
    width: Matrics.s(22),
    height: Matrics.vs(22),
    paddingHorizontal: Matrics.s(2),
    paddingVertical: Matrics.s(2),
  },
  containerDisabled: {
    opacity: 0.8,
    backgroundColor: "rgba(26, 26, 26, 0.05)",
  },
  inputDisabled: {
    color: colors.TEXT_SECONDARY,
  },
  searchIconDisabled: {
    opacity: 0.8,
  },
});

export default CommonSearchBar;
