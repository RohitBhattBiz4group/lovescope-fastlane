import React from "react";
import {
  TextInput as RNTextInput,
  TextInputProps,
  View,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { commonStyles } from "./styles";
import { colors } from "../../config/appStyling";
import { Control, Controller } from "react-hook-form";
import CommonError from "./CommonError";

const combinedStyles = {
  ...commonStyles.input,
};

interface CustomTextInputProps extends TextInputProps {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
  name: string;
  value?: string;
  control?: Control<any>;
  allowPattern?: RegExp;
  disable?: boolean;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  label,
  containerStyle,
  inputStyle,
  leftIcon,
  rightIcon,
  required = false,
  name,
  value,
  control,
  disable = false,
  ...props
}) => {
  const disabledInputStyle = disable
    ? {
        backgroundColor: colors.GRAY_LIGHT,
        color: colors.GRAY_DARK,
      }
    : undefined;

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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
                position: "relative",
              }}
            >
              {leftIcon && (
                <View style={{ position: "absolute", left: 12, zIndex: 1 }}>
                  {leftIcon}
                </View>
              )}

              <RNTextInput
                style={[
                  combinedStyles,
                  leftIcon && { paddingLeft: 40 },
                  rightIcon && { paddingRight: 40 },
                  disabledInputStyle,
                  inputStyle as any,
                ]}
                placeholderTextColor={colors.SECONDARY}
                {...props}
                editable={!disable}
                onBlur={field.onBlur}
                value={field.value !== null && field.value !== undefined ? String(field.value) : ""}
                onChangeText={(text: string) => {
                  // Support allowPattern prop to restrict input (e.g., only numeric for OTP)
                  if ((props as any).allowPattern) {
                    const pattern = (props as any).allowPattern;
                    const filteredText = text
                      .split("")
                      .filter((char) => pattern.test(char))
                      .join("");
                    field.onChange(filteredText);
                  } else {
                    field.onChange(text);
                  }
                }}
              />
              {rightIcon && (
                <View
                  style={{
                    position: "absolute",
                    right: 15,
                    top: 18,
                    width: 25,
                    height: 25,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {rightIcon}
                </View>
              )}
            </View>
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
          position: "relative",
        }}
      >
        {leftIcon && (
          <View style={{ position: "absolute", left: 12, zIndex: 1 }}>
            {leftIcon}
          </View>
        )}

        <RNTextInput
          style={[
            combinedStyles,
            leftIcon && { paddingLeft: 40 },
            rightIcon && { paddingRight: 40 },
            disabledInputStyle,
            inputStyle as any,
          ]}
          placeholderTextColor="#7e7d81"
          value={value}
          {...props}
          editable={!disable}
          onChangeText={(text: string) => {
            // Support allowPattern prop to restrict input (e.g., only numeric for OTP)
            if ((props as any).allowPattern && (props as any).onChangeText) {
              const pattern = (props as any).allowPattern;
              const filteredText = text
                .split("")
                .filter((char) => pattern.test(char))
                .join("");
              (props as any).onChangeText(filteredText);
            } else if ((props as any).onChangeText) {
              (props as any).onChangeText(text);
            }
          }}
        />
        {rightIcon && (
          <View
            style={{
              position: "absolute",
              right: 15,
              top: 18,
              width: 25,
              height: 25,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {rightIcon}
          </View>
        )}
      </View>
    </View>
  );
};

export default CustomTextInput;
