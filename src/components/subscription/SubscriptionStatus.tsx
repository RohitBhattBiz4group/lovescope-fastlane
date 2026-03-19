import React from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import { CurrentSubscriptionResponse } from "../../services/subscriptionService";
import useTranslation from "../../hooks/useTranslation";

type Props = {
  current?: CurrentSubscriptionResponse;
};

const SubscriptionStatus = ({ current }: Props) => {
  const { t } = useTranslation();

  if (!current) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("subscription.current_plan")}</Text>
      <Text style={styles.value}>{`${current.plan_code} • ${current.status}`}</Text>
      <Text style={styles.subValue}>{t("subscription.tier", { tier: current.tier })}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Matrics.s(10),
    padding: Matrics.s(14),
    borderWidth: 1,
    borderColor: "rgba(31, 31, 31, 0.12)",
    backgroundColor: colors.WHITE,
    marginBottom: Matrics.vs(14),
  },
  title: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(6),
  },
  value: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
  },
  subValue: {
    marginTop: Matrics.vs(2),
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    opacity: 0.7,
  },
});

export default SubscriptionStatus;
