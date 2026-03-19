import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Images from "../../config/Images";
import {
  colors,
  FontsSize,
  Matrics,
  typography,
} from "../../config/appStyling";

// const errorIcon = require("../../assets/images/error.png"); // Use your own error icon path
// const successIcon = require("../../assets/images/success.png"); // Use your own success icon path

export const toastConfig = {
  error: ({ text1, text2 }: any) => (
    <View style={styles.containerError}>
      {/* <Image source={errorIcon} style={styles.icon} /> */}
      <View style={styles.textContainer}>
        <Text style={styles.text1}>{text1}</Text>
        <Text style={styles.text2}>{text2}</Text>
      </View>
    </View>
  ),
  success: ({ text1, text2 }: any) => (
    <View style={styles.containerSuccess}>
      {/* <Image source={successIcon} style={styles.icon} /> */}
      <View style={styles.textContainer}>
        <Text style={styles.text1}>{text1}</Text>
        <Text style={styles.text2}>{text2}</Text>
      </View>
    </View>
  ),
  info: ({ text1, text2 }: any) => (
    <View style={styles.containerInfo}>
      {/* <Image source={infoIcon} style={styles.icon} /> */}
      <View style={styles.textContainer}>
        <Text style={styles.text1}>{text1}</Text>
        <Text style={styles.text2}>{text2}</Text>
      </View>
    </View>
  ),
  upgrade: ({ text1, text2, props }: any) => (
    <View style={styles.containerUpgrade}>
      <View style={styles.upgradeHeaderRow}>
        <Image
          source={Images.LOCK_ICON}
          style={styles.upgradeIcon}
          resizeMode="contain"
        />
        <Text style={styles.upgradeHeading}>{text1}</Text>
      </View>
      {!!text2 && <Text style={styles.upgradeDescription}>{text2}</Text>}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => props?.onPress?.()}
        style={styles.upgradeCtaWrapper}
      >
        <Text style={styles.upgradeCtaText}>{props?.ctaText}</Text>
        <Image
          source={Images.BACK_Bold}
          style={styles.upgradeArrowIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  ),
};

const styles = StyleSheet.create({
  containerError: {
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderLeftColor: "#FB5147",
    borderLeftWidth: 6,
    borderRadius: 8,
    elevation: 2,
    flexDirection: "row",
    marginHorizontal: 8,
    marginTop: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  containerInfo: {
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderLeftColor: "#88CFFD",
    borderLeftWidth: 6,
    borderRadius: 8,
    elevation: 2,
    flexDirection: "row",
    marginHorizontal: 8,
    marginTop: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  containerSuccess: {
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderLeftColor: "#4BB543",
    borderLeftWidth: 6,
    borderRadius: 8,
    elevation: 2,
    flexDirection: "row",
    marginHorizontal: 8,
    marginTop: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  containerUpgrade: {
    backgroundColor: "#fff",
    borderLeftColor: "#FB5147",
    borderLeftWidth: 6,
    borderRadius: 8,
    elevation: 2,
    marginHorizontal: 8,
    marginTop: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    minWidth: "92%",
  },
  icon: {
    height: 24,
    marginRight: 8,
    marginTop: 2,
    width: 24,
  },
  upgradeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  upgradeIcon: {
    width: 28,
    height: 28,
    marginRight: 6,
  },
  upgradeHeading: {
    color: colors.TEXT_PRIMARY,
    fontSize: Matrics.ms(13),
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: "600",
    flex: 1,
  },
  upgradeDescription: {
    color: colors.TEXT_PRIMARY,
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    fontWeight: "400",
    lineHeight: 16,
    marginBottom: 2,
  },
  text1: {
    color: colors.TEXT_PRIMARY,
    flexWrap: "wrap",
    fontSize: FontsSize.Small,
    marginBottom: 2,
    fontFamily: typography.fontFamily.Satoshi.Regular,
  },
  text2: {
    color: colors.GRAY_DARK,
    flexWrap: "wrap",
    fontSize: 10,
  },
  upgradeCtaWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    marginTop: 6,
  },
  upgradeCtaText: {
    color: "#2A66F6",
    fontSize: FontsSize.Small,
    fontWeight: "500",
    marginRight: 4,
  },
  upgradeArrowIcon: {
    width: 12,
    height: 12,
    tintColor: "#2A66F6",
    transform: [{ rotate: "180deg" }],
    marginBottom: -3,
  },
  textContainer: {
    flex: 1,
  },
});
