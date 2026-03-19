import React from "react";
import {
  TextInput as RNTextInput,
  TextInputProps,
  View,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from "react-native";
import { commonStyles } from "./styles";
import {
  colors,
  Matrics,
  FontsSize,
  typography,
} from "../../config/appStyling";
import { Control, Controller } from "react-hook-form";
import CommonError from "./CommonError";

const combinedStyles = {
  ...commonStyles.input,
};

interface TextAreaProps extends TextInputProps {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  error?: string;
  required?: boolean;
  name: string;
  value?: string;
  control?: Control<any>;
  maxLength?: number;
  showCharCount?: boolean;
  charCountWarningThreshold?: number;
  upgradeCtaText?: string;
  onUpgradePress?: () => void;
}

const TextArea: React.FC<TextAreaProps> = ({
  label,
  containerStyle,
  inputStyle,
  required = false,
  name,
  value,
  control,
  maxLength,
  showCharCount = true,
  charCountWarningThreshold,
  upgradeCtaText,
  onUpgradePress,
  ...props
}) => {
  if (control) {
    return (
      <Controller
        render={({ field, fieldState }) => (
          <View style={[commonStyles.inputContainer, containerStyle]}>
            {label && (
              <Text style={commonStyles.inputLabel}>
                {label}
                {required && <Text style={{ color: colors.DANGER }}> *</Text>}
              </Text>
            )}
            <RNTextInput
              style={[
                combinedStyles,
                {
                  height: Matrics.vs(120),
                  textAlignVertical: "top",
                  paddingTop: Matrics.vs(15),
                },
                inputStyle as any,
              ]}
              placeholderTextColor={colors.SECONDARY}
              multiline
              numberOfLines={4}
              maxLength={maxLength}
              {...props}
              {...field}
              onChangeText={(text: string) => {
                field.onChange(text);
              }}
            />
            {showCharCount && maxLength && (
              <View style={styles.charCountContainer}>
                <Text
                  style={[
                    styles.charCount,
                    charCountWarningThreshold !== undefined &&
                      (field.value?.length || 0) >= charCountWarningThreshold &&
                      styles.charCountWarning,
                  ]}
                >
                  {field.value?.length || 0}/{maxLength}
                </Text>
                {onUpgradePress && upgradeCtaText &&
                  charCountWarningThreshold !== undefined &&
                  (field.value?.length || 0) >= charCountWarningThreshold && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={onUpgradePress}
                      style={styles.upgradeCtaButton}
                    >
                      <Text style={styles.upgradeCtaText}>{upgradeCtaText}</Text>
                    </TouchableOpacity>
                  )}
              </View>
            )}
            {fieldState?.error && fieldState.isTouched && (
              <CommonError message={fieldState.error.message}></CommonError>
            )}
          </View>
        )}
        control={control}
        name={name}
        defaultValue={value || ""}
      />
    );
  }

  return (
    <View style={[commonStyles.inputContainer, containerStyle]}>
      {label && (
        <Text style={commonStyles.inputLabel}>
          {label}
          {required && <Text style={{ color: colors.DANGER }}> *</Text>}
        </Text>
      )}
      <RNTextInput
        style={[
          combinedStyles,
          {
            height: Matrics.vs(120),
            textAlignVertical: "top",
            paddingTop: Matrics.vs(15),
          },
          inputStyle as any,
        ]}
        placeholderTextColor={colors.SECONDARY}
        value={value}
        multiline
        numberOfLines={4}
        maxLength={maxLength}
        {...props}
      />
      {showCharCount && maxLength && (
        <View style={styles.charCountContainer}>
          <Text
            style={[
              styles.charCount,
              charCountWarningThreshold !== undefined &&
                (value?.length || 0) >= charCountWarningThreshold &&
                styles.charCountWarning,
            ]}
          >
            {value?.length || 0}/{maxLength}
          </Text>
          {onUpgradePress && upgradeCtaText &&
            charCountWarningThreshold !== undefined &&
            (value?.length || 0) >= charCountWarningThreshold && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onUpgradePress}
                style={styles.upgradeCtaButton}
              >
                <Text style={styles.upgradeCtaText}>{upgradeCtaText}</Text>
              </TouchableOpacity>
            )}
        </View>
      )}
    </View>
  );
};

const styles = {
  charCountContainer: {
    alignItems: "flex-end" as const,
    marginTop: Matrics.vs(0),
  },
  charCount: {
    fontSize: FontsSize.Small,
    paddingEnd: 10,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: "#9CA3AF",
    textAlign: "right" as const,
  },
  charCountWarning: {
    color: colors.DANGER,
  },
  upgradeCtaButton: {
    marginTop: Matrics.vs(6),
    paddingHorizontal: Matrics.s(10),
    paddingVertical: Matrics.vs(6),
    borderRadius: Matrics.s(8),
    backgroundColor: "rgba(46, 123, 240, 0.12)",
  },
  upgradeCtaText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.PRIMARY,
  },
};

export default TextArea;
