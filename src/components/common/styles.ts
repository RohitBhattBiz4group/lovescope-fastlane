import { StyleSheet } from "react-native";
import colors from "../../config/appStyling/colors";
import FontsSize from "../../config/appStyling/fontsSize";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Matrics.ms(15),
  },
  inputContainer: {
    width: "100%",
    marginBottom: Matrics.vs(15),
  },
  inputLabel: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(5),
  },
  input: {
    backgroundColor: colors.WHITE,
    borderRadius: Matrics.ms(12),
    padding: Matrics.vs(14),
    fontSize: FontsSize.Medium,
    color: colors.TEXT_DARK,
    borderWidth: 1,
    borderColor: "#EDF1F3",
    marginBottom: Matrics.ms(5),
    width: "100%",
    fontFamily: typography.fontFamily.Satoshi.Regular,
  },
  // Button Styles
  buttonPrimary: {
    width: "100%",
    height: Matrics.vs(52),
    backgroundColor: colors.PRIMARY,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    borderColor: colors.PRIMARY,
    borderWidth: 1,
  },
  buttonPrimaryFade: {
    width: "100%",
    height: Matrics.vs(40),
    backgroundColor: colors.WHITE,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "rgba(31, 31, 31, 0.20)",
    borderWidth: 1,
    paddingHorizontal: Matrics.ms(10),
    
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: FontsSize.Regular,
    color: colors.WHITE,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: 600,
     lineHeight: 22,
  },
  buttonFadeText: {
    color: colors.TEXT_DARK,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    
  },
  clearButton: {
    backgroundColor: "transparent",
    color: colors.PRIMARY,
    fontFamily: typography.fontFamily.Satoshi.SemiBold,
    borderWidth: 0,
    height: "auto",
  },
  clearButtonText: {
    fontSize: FontsSize.Medium,
    color: colors.PRIMARY,
    fontFamily: typography.fontFamily.Satoshi.SemiBold,
  },
  errorText: {
    fontSize: FontsSize.Small,
    color: colors.DANGER,
    marginTop: Matrics.vs(2),
    fontFamily: typography.fontFamily.Satoshi.Regular,
  },
  radioGroup: {
    flexDirection: "row",
    gap: 12,
  },
  radioOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDF1F3",
    borderRadius: 12,
    paddingVertical: Matrics.vs(14),
    paddingHorizontal: Matrics.s(12),
    backgroundColor: colors.WHITE,
  },
  radioOptionSelected: {
    backgroundColor: "rgba(31, 31, 31, 0.04)",
  },
  radioCircle: {
    height: 18,
    width: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(31, 31, 31, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: colors.WHITE,
  },
  radioCircleSelected: {
    position: "absolute",
    top: "50%",
    left: "50%",
    height: 10,
    width: 10,
    borderRadius: 10,
    backgroundColor: colors.PRIMARY,
    transform: [{ translateX: -5 }, { translateY: -5 }],
  },
  radioLabel: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: "rgba(31, 31, 31, 0.80)",
  },
});

