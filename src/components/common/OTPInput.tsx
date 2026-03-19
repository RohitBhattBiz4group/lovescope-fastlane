import React, { useRef, useState } from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import { Controller, Control } from "react-hook-form";
import { OtpInput, OtpInputRef } from "react-native-otp-entry";

import colors from "../../config/appStyling/colors";
import FontsSize from "../../config/appStyling/fontsSize";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";

interface OTPInputProps {
  name: string;
  control: Control<any>;
  length?: number;
  label?: string;
  error?: string;
}

const OTPInput: React.FC<OTPInputProps> = ({
  name,
  control,
  length = 4,
  label,
  error,
}) => {
  const otpRef = useRef<OtpInputRef>(null);
  const [isFilled, setIsFilled] = useState(false);

  const handleTextChange = (text: string, onChange: (value: string) => void) => {
    onChange(text);
    setIsFilled(text.length === length);
  };

  const handleLastFieldPress = () => {
    otpRef.current?.focus();
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange } }) => (
        <View style={styles.container}>
          {label && <Text style={styles.label}>{label}</Text>}
          <View style={styles.otpWrapper}>
            <OtpInput
              ref={otpRef}
              numberOfDigits={length}
              focusColor={colors.PRIMARY}
              type="numeric"
              blurOnFilled
              textInputProps={{
                contextMenuHidden: true,
                selectTextOnFocus: false,
                caretHidden: true,
              }}
              onTextChange={(text) => handleTextChange(text, onChange)}
              theme={{
                containerStyle: styles.otpContainer,
                pinCodeContainerStyle: [
                  styles.otpInput,
                  error ? styles.otpInputError : undefined,
                ],
                pinCodeTextStyle: styles.otpText,
                focusedPinCodeContainerStyle: styles.otpInputFocused,
                filledPinCodeContainerStyle: styles.otpInputFilled,
                focusStickStyle: styles.focusStick,
              }}
            />
            {isFilled && (
              <View style={styles.overlay}>
                {Array.from({ length }).map((_, index) => (
                  <Pressable
                    key={index}
                    style={styles.overlayField}
                    onPress={
                      index === length - 1
                        ? handleLastFieldPress
                        : undefined
                    }
                  />
                ))}
              </View>
            )}
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Matrics.vs(20),
  },
  label: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(8),
  },
  otpWrapper: {
    position: "relative",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Matrics.s(12),
  },
  otpInput: {
    flex: 1,
    height: Matrics.vs(56),
    borderWidth: 1,
    borderColor: "rgba(47, 46, 44, 0.2)",
    borderRadius: Matrics.s(12),
    backgroundColor: colors.WHITE,
  },
  otpText: {
    fontSize: FontsSize.Large,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    color: colors.TEXT_DARK,
  },
  otpInputFocused: {
    borderColor: colors.PRIMARY,
    borderWidth: 2,
  },
  otpInputFilled: {
    borderColor: colors.PRIMARY,
    borderWidth: 2,
  },
  otpInputError: {
    borderColor: colors.DANGER,
  },
  focusStick: {
    backgroundColor: colors.PRIMARY,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    gap: Matrics.s(12),
  },
  overlayField: {
    flex: 1,
  },
  errorText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.DANGER,
    marginTop: Matrics.vs(6),
  },
});

export default OTPInput;
