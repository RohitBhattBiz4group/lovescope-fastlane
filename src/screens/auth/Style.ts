import { StyleSheet } from "react-native";
import { colors, FontsSize, Matrics, typography } from "../../config/appStyling";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bannerImage: {
    width: "100%",
    height: Matrics.screenHeight * 0.25,
  },
  formContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Matrics.ms(20),
    paddingTop: Matrics.vs(30),
    paddingBottom: Matrics.vs(20),
  },
  auth_header: {
    alignItems: "center",
    marginBottom: Matrics.vs(30),
    marginTop : Matrics.vs(10),
  },
  logo: {
    width: Matrics.s(97),
    height: Matrics.s(23),
    marginBottom: Matrics.vs(60),
  },
  title: {
    fontSize: FontsSize.Large,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(10),
    fontWeight : "600"
  },
  subtitle: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_PRIMARY,
    textAlign: "center",
    opacity: .6,
    paddingHorizontal : Matrics.ms(10)
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: Matrics.vs(30),
    marginTop: Matrics.vs(-10),
  },
  forgotPassword: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.SemiBold,
    color: colors.PRIMARY,
    margin : 0
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Matrics.vs(14),
    width: "100%",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.TEXT_PRIMARY,
    opacity : .2
  },
  dividerText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    opacity: .8,
    marginHorizontal: Matrics.ms(12),
  },
  socialButtonsContainer: {
    flexDirection: "row",
    marginBottom: Matrics.vs(0),
    gap: Matrics.ms(15),
  },
  socialButton: {
    flex: 1,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Matrics.vs(40),
    marginTop: Matrics.vs(20),
  },
  signupText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: "rgba(31, 31, 31, 0.80)",
  },
  termsText: {
    fontSize: FontsSize.Small,
    color: "rgba(31, 31, 31, 0.80)",
    textAlign: "center",
    paddingHorizontal: Matrics.ms(20),
    marginTop: Matrics.vs(20),
    fontFamily: typography.fontFamily.Satoshi.Medium,
    lineHeight : 20
  },
  termsLink: {
    color: colors.TEXT_DARK,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    textDecorationLine: "underline",
  },
  emailText:{
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    opacity: 1,
    color: colors.TEXT_PRIMARY
  }
});

