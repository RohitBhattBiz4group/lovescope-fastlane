import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ImageSourcePropType,
} from "react-native";
import Matrics from "../../config/appStyling/matrics";
import colors from "../../config/appStyling/colors";
import typography from "../../config/appStyling/typography";
import Images from "../../config/Images";
import FontsSize from "../../config/appStyling/fontsSize";

interface EmptyDataProps {
  icon?: ImageSourcePropType;
  title: string;
  description: string;
  iconSize?: number;
  containerStyle?: any;
}

const EmptyData: React.FC<EmptyDataProps> = ({
  icon = Images.FRIENDS_ICON,
  title,
  description,
  iconSize = Matrics.ms(32),
  containerStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.content}>
        {/* Icon Circle */}
        <View style={styles.iconCircle}>
          <Image
            source={icon}
            style={[styles.icon, { width: iconSize, height: iconSize }]}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Description */}
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Matrics.screenHeight,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Matrics.s(20),
  },
  content: {
    justifyContent: "center",
    alignItems: "center",
    maxWidth: Matrics.s(300),
  },
  iconCircle: {
    width: Matrics.s(70),
    height: Matrics.s(70),
    borderRadius: Matrics.s(100),
    backgroundColor: "rgba(47, 89, 235, 0.10)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Matrics.vs(15),
  },
  icon: {
    tintColor: colors.PRIMARY,
  },
  title: {
    color: colors.TEXT_PRIMARY,
    textAlign: "center",
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontSize: FontsSize.Large,
    fontWeight: "600",
    lineHeight: Matrics.ms(24), // 120% of 20px
    marginBottom: Matrics.vs(10),
  },
  description: {
    color: colors.TEXT_PRIMARY,
    textAlign: "center",
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontSize: FontsSize.Medium,
    fontWeight: "500",
    lineHeight: Matrics.ms(20), // 150% of 14px
    opacity: 0.6,
    paddingHorizontal: Matrics.s(10),
  },
});

export default EmptyData;
