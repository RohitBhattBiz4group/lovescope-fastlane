import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Linking,
} from "react-native";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import LinearGradient from "react-native-linear-gradient";
import subscriptionService from "../../services/subscriptionService";
import { ISubscriptionPlan } from "../../interfaces/subscriptionInterface";
import { useSubscriptionIAP } from "../../hooks/useSubscriptionIAP";
import {
  SUBSCRIPTION_PLAN,
  BILLING_CYCLE,
  PREMIUM,
  PREMIUM_PLUS,
} from "../../constants/commonConstant";
import useAuth from "../../hooks/useAuth";
import { useTranslation } from "react-i18next";

type ProBillingCycle = "monthly" | "yearly";

type ProTier = "premium" | "premium_plus";

type SelectedPlan = {
  tier: ProTier;
  cycle: ProBillingCycle;
} | null;

const Subscription = ({ navigation }: ScreenProps) => {
  const { t } = useTranslation();
  const { authData } = useAuth();

  const [plans, setPlans] = useState<ISubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>(null);

  const currentUserPlanName = authData?.plan?.product_id;

  useEffect(() => {
    if (!currentUserPlanName) {
      setSelectedPlan(null);
      return;
    }

    const derivedSelectedPlan: SelectedPlan =
      currentUserPlanName === SUBSCRIPTION_PLAN.PREMIUM_MONTHLY
        ? { tier: PREMIUM, cycle: BILLING_CYCLE.MONTHLY }
        : currentUserPlanName === SUBSCRIPTION_PLAN.PREMIUM_YEARLY
          ? { tier: PREMIUM, cycle: BILLING_CYCLE.YEARLY }
          : currentUserPlanName === SUBSCRIPTION_PLAN.PREMIUM_PLUS_MONTHLY
            ? { tier: PREMIUM_PLUS, cycle: BILLING_CYCLE.MONTHLY }
            : currentUserPlanName === SUBSCRIPTION_PLAN.PREMIUM_PLUS_YEARLY
              ? { tier: PREMIUM_PLUS, cycle: BILLING_CYCLE.YEARLY }
              : null;

    if (!derivedSelectedPlan) {
      setSelectedPlan(null);
      return;
    }

    setSelectedPlan((prev) => {
      if (!prev) return derivedSelectedPlan;
      if (
        prev.tier === derivedSelectedPlan.tier &&
        prev.cycle === derivedSelectedPlan.cycle
      )
        return prev;
      return derivedSelectedPlan;
    });
  }, [currentUserPlanName]);

  const currentUserCycle = useMemo(() => {
    if (!currentUserPlanName) return undefined;
    if (currentUserPlanName.endsWith(`_${BILLING_CYCLE.MONTHLY}`))
      return BILLING_CYCLE.MONTHLY;
    if (currentUserPlanName.endsWith(`_${BILLING_CYCLE.YEARLY}`))
      return BILLING_CYCLE.YEARLY;
    return undefined;
  }, [currentUserPlanName]);

  const isYearlySubscriber = currentUserCycle === BILLING_CYCLE.YEARLY;

  const freePlan = plans.find((p) => p.plan_name === SUBSCRIPTION_PLAN.BASIC);
  const premiumMonthlyPlan = plans.find(
    (p) => p.plan_name === SUBSCRIPTION_PLAN.PREMIUM_MONTHLY,
  );
  const premiumYearlyPlan = plans.find(
    (p) => p.plan_name === SUBSCRIPTION_PLAN.PREMIUM_YEARLY,
  );
  const premiumPlusMonthlyPlan = plans.find(
    (p) => p.plan_name === SUBSCRIPTION_PLAN.PREMIUM_PLUS_MONTHLY,
  );
  const premiumPlusYearlyPlan = plans.find(
    (p) => p.plan_name === SUBSCRIPTION_PLAN.PREMIUM_PLUS_YEARLY,
  );

  const isCurrentPremium =
    currentUserPlanName === SUBSCRIPTION_PLAN.PREMIUM_MONTHLY ||
    currentUserPlanName === SUBSCRIPTION_PLAN.PREMIUM_YEARLY;

  const isCurrentPremiumPlus =
    currentUserPlanName === SUBSCRIPTION_PLAN.PREMIUM_PLUS_MONTHLY ||
    currentUserPlanName === SUBSCRIPTION_PLAN.PREMIUM_PLUS_YEARLY;

  const subscriptionProductIds = useMemo(
    () =>
      plans
        .filter((p) => p.plan_name !== SUBSCRIPTION_PLAN.BASIC)
        .map((p) => p.plan_name),
    [plans],
  );

  const { buySubscription, loading, products } = useSubscriptionIAP(
    subscriptionProductIds,
  );

  const storeProductById = useMemo(() => {
    const map = new Map();
    (products || []).forEach((p: any) => {
      const id = p?.productId ?? p?.id ?? p?.sku;
      if (typeof id === "string" && id.length > 0) {
        map.set(id, p);
      }
    });
    return map;
  }, [products]);

  const getPlanPriceLabel = useCallback(
    (plan?: ISubscriptionPlan) => {
      if (!plan?.plan_name) return "";

      const storeProduct = storeProductById.get(plan.plan_name);
      if (storeProduct) {
        const currency = storeProduct?.currency;
        const price = storeProduct?.price;
        if (currency != null && price != null) {
          return `${currency} ${price}`;
        }
      }

      const dbCurrency = plan?.currency;
      const dbPrice = plan?.price;
      if (dbCurrency && dbPrice) {
        return `${dbCurrency} ${dbPrice}`;
      }

      return "";
    },
    [storeProductById],
  );

  const normalizeFeatures = (features: unknown): string[] => {
    if (!features) return [];
    if (Array.isArray(features)) {
      return features.filter(
        (x): x is string => typeof x === "string" && x.trim().length > 0,
      );
    }
    if (typeof features === "object") {
      return Object.values(features as Record<string, unknown>).filter(
        (x): x is string => typeof x === "string" && x.trim().length > 0,
      );
    }
    return [];
  };

  const getSubscriptionsPlans = useCallback(async () => {
    try {
      setPlansLoading(true);
      const plans = await subscriptionService.getSubscriptionPlans();
      if (plans.success && plans.data && plans.data.length > 0) {
        setPlans(plans.data);
      }
    } catch (error) {
      console.log("Failed to get subscription plans", error);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    getSubscriptionsPlans();
  }, [getSubscriptionsPlans]);

  const handleBuyNow = () => {
    if (!selectedPlan) {
      return;
    }

    const planToBuy =
      selectedPlan.tier === PREMIUM
        ? selectedPlan.cycle === BILLING_CYCLE.MONTHLY
          ? premiumMonthlyPlan
          : premiumYearlyPlan
        : selectedPlan.cycle === BILLING_CYCLE.MONTHLY
          ? premiumPlusMonthlyPlan
          : premiumPlusYearlyPlan;

    if (!planToBuy?.plan_name) {
      console.log("No product id found");
      return;
    }

    buySubscription(planToBuy.plan_name);
  };

  const onSelectPlan = (tier: ProTier, cycle: ProBillingCycle) => {
    setSelectedPlan({ tier, cycle });
  };

  const renderFeatureItem = (
    featureText: string,
    index: number,
    isWhite: boolean = false,
  ) => (
    <View key={index} style={styles.featureItem}>
      <View
        style={[
          styles.bulletPoint,
          isWhite ? styles.bulletPointWhite : styles.bulletPointDark,
        ]}
      />
      <Text
        style={[
          styles.featureText,
          isWhite ? styles.featureTextWhite : styles.featureTextDark,
        ]}
      >
        {featureText}
      </Text>
    </View>
  );

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err),
    );
  };

  const renderMonthlyContent = () => (
    <>
      {/* Free Plan Card */}
      {freePlan && (
        <View key={freePlan.id} style={[styles.planCard, styles.freePlanCard]}>
          <View style={styles.freePlanHeader}>
            <Text style={[styles.planTitle, styles.planTitleDark]}>
              {t("subscription.free")}
            </Text>

            {!authData?.plan?.product_id && (
              <TouchableOpacity
                style={styles.freeCurrentPlanPill}
                activeOpacity={0.7}
              >
                <Text style={styles.freeCurrentPlanPillText}>
                  {t("subscription.current_plan")}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text
            style={[
              styles.includedFeaturesTitle,
              styles.includedFeaturesTitleDark,
              styles.freeIncludedFeaturesTitle,
            ]}
          >
            {t("subscription.included_features")}
          </Text>
          <View style={[styles.featuresList, styles.freeFeaturesList]}>
            {normalizeFeatures(freePlan.features).map((featureText, index) =>
              renderFeatureItem(featureText, index),
            )}
          </View>
        </View>
      )}

      {premiumMonthlyPlan && (
        <View
          key={premiumMonthlyPlan.id}
          style={[styles.planCard, styles.proPlanCard]}
        >
          <View style={styles.planHeader}>
            <Text style={[styles.planTitle, styles.planTitleWhite]}>
              {t("subscription.premium")}
            </Text>
            {isCurrentPremium && (
              <TouchableOpacity
                style={styles.proCurrentPlanPill}
                activeOpacity={0.7}
              >
                <Text style={styles.proCurrentPlanPillText}>
                  {t("subscription.current_plan")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text
            style={[
              styles.includedFeaturesTitle,
              styles.includedFeaturesTitleWhite,
            ]}
          >
            {t("subscription.included_features")}
          </Text>
          <View style={styles.featuresList}>
            {normalizeFeatures(
              (selectedPlan?.tier === PREMIUM &&
              selectedPlan?.cycle === BILLING_CYCLE.YEARLY
                ? premiumYearlyPlan
                : premiumMonthlyPlan
              )?.features,
            ).map((featureText, index) =>
              renderFeatureItem(featureText, index, true),
            )}
          </View>

          <View style={styles.billingRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.billingBox,
                selectedPlan?.tier === PREMIUM &&
                selectedPlan?.cycle === BILLING_CYCLE.MONTHLY
                  ? styles.billingBoxSelected
                  : styles.billingBoxUnselected,
              ]}
              disabled={isYearlySubscriber || isCurrentPremiumPlus}
              onPress={() => onSelectPlan(PREMIUM, BILLING_CYCLE.MONTHLY)}
            >
              <View
                style={
                  selectedPlan?.tier === PREMIUM &&
                  selectedPlan?.cycle === BILLING_CYCLE.MONTHLY
                    ? styles.billingContentSelected
                    : styles.billingContentUnselected
                }
              >
                <Text style={[styles.billingTitle, styles.billingTitleMuted]}>
                  {t("subscription.monthly")}
                </Text>
                <View style={styles.billingPriceRow}>
                  <Text
                    style={[styles.billingAmount, styles.billingAmountMuted]}
                  >
                    {premiumMonthlyPlan
                      ? getPlanPriceLabel(premiumMonthlyPlan)
                      : ""}
                  </Text>
                  <Text
                    style={[styles.billingSubText, styles.billingSubTextMuted]}
                  >
                    {" "}
                    /{t("subscription.month")}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.billingBox,
                selectedPlan?.tier === PREMIUM &&
                selectedPlan?.cycle === BILLING_CYCLE.YEARLY
                  ? styles.billingBoxSelected
                  : styles.billingBoxUnselected,
              ]}
              onPress={() => onSelectPlan(PREMIUM, BILLING_CYCLE.YEARLY)}
              disabled={isCurrentPremiumPlus}
            >
              <View style={styles.billingTitleRow}>
                <View
                  style={
                    selectedPlan?.tier === PREMIUM &&
                    selectedPlan?.cycle === BILLING_CYCLE.YEARLY
                      ? styles.billingContentSelected
                      : styles.billingContentUnselected
                  }
                >
                  <Text style={[styles.billingTitle, styles.billingTitleWhite]}>
                    {t("subscription.yearly")}
                  </Text>
                </View>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>
                    {t("subscription.save")}{" "}
                    {premiumMonthlyPlan && premiumYearlyPlan
                      ? Math.round(
                          100 -
                            (Number(premiumYearlyPlan.price) /
                              (Number(premiumMonthlyPlan.price) * 12)) *
                              100,
                        )
                      : 0}
                    %
                  </Text>
                </View>
              </View>
              <View
                style={
                  selectedPlan?.tier === PREMIUM &&
                  selectedPlan?.cycle === BILLING_CYCLE.YEARLY
                    ? styles.billingContentSelected
                    : styles.billingContentUnselected
                }
              >
                <View style={styles.billingPriceRow}>
                  <Text
                    style={[styles.billingAmount, styles.billingAmountWhite]}
                  >
                    {premiumYearlyPlan
                      ? getPlanPriceLabel(premiumYearlyPlan)
                      : ""}
                  </Text>
                  <Text
                    style={[styles.billingSubText, styles.billingSubTextMuted]}
                  >
                    {" "}
                    /{t("subscription.year")}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {premiumPlusMonthlyPlan && (
        <View
          key={premiumPlusMonthlyPlan.id}
          style={[styles.planCard, styles.freePlanCard]}
        >
          <View style={styles.planHeader}>
            <Text style={[styles.planTitle, styles.planTitleDark]}>
              {t("subscription.premium_plus")}
            </Text>
            {isCurrentPremiumPlus && (
              <TouchableOpacity
                style={styles.freeCurrentPlanPill}
                activeOpacity={0.7}
              >
                <Text style={styles.freeCurrentPlanPillText}>
                  {t("subscription.current_plan")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text
            style={[
              styles.includedFeaturesTitle,
              styles.includedFeaturesTitleDark,
            ]}
          >
            {t("subscription.included_features")}
          </Text>
          <View style={styles.featuresList}>
            {normalizeFeatures(
              (selectedPlan?.tier === PREMIUM_PLUS &&
              selectedPlan?.cycle === BILLING_CYCLE.YEARLY
                ? premiumPlusYearlyPlan
                : premiumPlusMonthlyPlan
              )?.features,
            ).map((featureText, index) =>
              renderFeatureItem(featureText, index),
            )}
          </View>

          <View style={styles.billingRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.billingBoxLight,
                selectedPlan?.tier === PREMIUM_PLUS &&
                selectedPlan?.cycle === BILLING_CYCLE.MONTHLY
                  ? styles.billingBoxLightSelected
                  : styles.billingBoxLightUnselected,
              ]}
              disabled={
                authData?.plan?.product_id ===
                SUBSCRIPTION_PLAN.PREMIUM_PLUS_YEARLY
              }
              onPress={() => onSelectPlan(PREMIUM_PLUS, BILLING_CYCLE.MONTHLY)}
            >
              <View
                style={
                  selectedPlan?.tier === PREMIUM_PLUS &&
                  selectedPlan?.cycle === BILLING_CYCLE.MONTHLY
                    ? styles.billingContentSelected
                    : styles.billingContentUnselected
                }
              >
                <Text style={[styles.billingTitle, styles.billingTitleDark]}>
                  {t("subscription.monthly")}
                </Text>
                <View style={styles.billingPriceRow}>
                  <Text
                    style={[styles.billingAmount, styles.billingAmountDark]}
                  >
                    {premiumPlusMonthlyPlan
                      ? getPlanPriceLabel(premiumPlusMonthlyPlan)
                      : ""}
                  </Text>
                  <Text
                    style={[styles.billingSubText, styles.billingSubTextDark]}
                  >
                    {" "}
                    /{t("subscription.month")}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.billingBoxLight,
                selectedPlan?.tier === PREMIUM_PLUS &&
                selectedPlan?.cycle === BILLING_CYCLE.YEARLY
                  ? styles.billingBoxLightSelected
                  : styles.billingBoxLightUnselected,
              ]}
              onPress={() => onSelectPlan(PREMIUM_PLUS, BILLING_CYCLE.YEARLY)}
            >
              <View style={styles.billingTitleRow}>
                <View
                  style={
                    selectedPlan?.tier === PREMIUM_PLUS &&
                    selectedPlan?.cycle === BILLING_CYCLE.YEARLY
                      ? styles.billingContentSelected
                      : styles.billingContentUnselected
                  }
                >
                  <Text style={[styles.billingTitle, styles.billingTitleDark]}>
                    {t("subscription.yearly")}
                  </Text>
                </View>
                <View style={styles.saveBadgeDark}>
                  <Text style={styles.saveBadgeTextDark}>
                    {t("subscription.save")}{" "}
                    {premiumPlusMonthlyPlan && premiumPlusYearlyPlan
                      ? Math.round(
                          100 -
                            (Number(premiumPlusYearlyPlan.price) /
                              (Number(premiumPlusMonthlyPlan.price) * 12)) *
                              100,
                        )
                      : 0}
                    %
                  </Text>
                </View>
              </View>
              <View
                style={
                  selectedPlan?.tier === PREMIUM_PLUS &&
                  selectedPlan?.cycle === BILLING_CYCLE.YEARLY
                    ? styles.billingContentSelected
                    : styles.billingContentUnselected
                }
              >
                <View style={styles.billingPriceRow}>
                  <Text
                    style={[styles.billingAmount, styles.billingAmountDark]}
                  >
                    {premiumPlusYearlyPlan
                      ? getPlanPriceLabel(premiumPlusYearlyPlan)
                      : ""}
                  </Text>
                  <Text
                    style={[styles.billingSubText, styles.billingSubTextDark]}
                  >
                    {" "}
                    /{t("subscription.year")}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );

  return (
    <LinearGradient
      colors={["rgba(255, 255, 255, 1)", "rgba(226, 232, 252)"]}
      locations={[0.1977, 1]}
      style={styles.container}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={false}
      />

      {/* Content */}
      {plansLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {renderMonthlyContent()}

            {/* Subscription Terms and Conditions / footer of the page */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsTitle}>
                {t("subscription.subscription_terms")}
              </Text>

              <View style={styles.termItem}>
                <View style={styles.termBullet} />
                <Text style={styles.termText}>
                  {t("subscription.auto_renew")}
                </Text>
              </View>

              <View style={styles.termItem}>
                <View style={styles.termBullet} />
                <Text style={styles.termText}>
                  {t("subscription.manage_subscription")}
                </Text>
              </View>

              <View style={styles.termItem}>
                <View style={styles.termBullet} />
                <Text style={styles.termText}>
                  {t("subscription.free_trial")}
                </Text>
              </View>
            </View>

            {/* Footer Links */}
            <View style={styles.footerLinks}>
              <TouchableOpacity
                onPress={() => handleLinkPress("https://www.lovescope.app")}
              >
                <Text style={styles.footerLinkText}>
                  {t("subscription.faq")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  handleLinkPress("https://www.lovescope.app/privacy-policy")
                }
              >
                <Text style={styles.footerLinkText}>
                  {t("subscription.privacy_policy")}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>
                {t("subscription.in_case_of_any_query_checkout_our")}{" "}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  handleLinkPress("https://www.lovescope.app/support")
                }
              >
                <Text style={styles.helpLinkText}>
                  {t("subscription.help_page")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <TouchableOpacity
            style={[
              styles.planButton,
              styles.buyPlanButton,
              (!selectedPlan || loading) && styles.buyPlanButtonDisabled,
            ]}
            activeOpacity={0.7}
            onPress={handleBuyNow}
            disabled={!selectedPlan || loading}
          >
            <Text style={[styles.planButtonText, styles.buyPlanButtonText]}>
              {loading ? "Processing..." : "Buy Now"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Tab Switcher
  tabContainer: {
    flexDirection: "row",
    alignSelf: "flex-start",
    backgroundColor: "#EFEFEF",
    borderRadius: Matrics.s(30),
    marginHorizontal: Matrics.vs(20),
    marginBottom: Matrics.vs(20),
    marginTop: 10,
  },
  tab: {
    paddingVertical: Matrics.vs(14),
    paddingHorizontal: Matrics.s(32),
    alignItems: "center",
    opacity: 0.6,
    borderTopLeftRadius: Matrics.s(100),
    borderBottomLeftRadius: Matrics.s(100),
  },
  tabLast: {
    borderTopLeftRadius: Matrics.s(0),
    borderBottomLeftRadius: Matrics.s(0),
    borderTopRightRadius: Matrics.s(100),
    borderBottomRightRadius: Matrics.s(100),
  },
  activeTab: {
    backgroundColor: colors.PRIMARY,
    opacity: 1,
  },
  tabText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    opacity: 0.8,
    lineHeight: 22,
  },

  activeTabText: {
    color: colors.WHITE,
    opacity: 1,
  },
  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Matrics.s(20),
    paddingBottom: Matrics.vs(30),
    paddingTop: Matrics.vs(5),
  },
  // Plan Card Base
  planCard: {
    borderRadius: Matrics.s(10),
    paddingHorizontal: Matrics.s(16),
    paddingVertical: Matrics.s(22),
    marginBottom: Matrics.vs(16),
    borderColor: "rgba(31, 31, 31, 0.20)",
    borderWidth: 1,
  },
  freePlanCard: {
    backgroundColor: colors.WHITE,
    borderColor: "rgba(31, 31, 31, 0.12)",
  },
  proPlanCard: {
    backgroundColor: colors.PRIMARY,
    paddingBottom: Matrics.vs(5),
  },
  // Plan Header
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Matrics.vs(15),
  },
  freePlanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Matrics.vs(15),
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  // Typography - Plan Titles
  planTitle: {
    fontSize: Matrics.ms(28),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
  },
  planTitleDark: {
    color: colors.TEXT_PRIMARY,
  },
  planTitleWhite: {
    color: colors.WHITE,
  },
  // Typography - Prices
  planPrice: {
    fontSize: Matrics.ms(32),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
  },
  planPriceDark: {
    color: colors.TEXT_PRIMARY,
  },
  planPriceWhite: {
    color: colors.WHITE,
  },
  // Typography - Period
  planPeriod: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    marginLeft: Matrics.s(2),
  },
  planPeriodDark: {
    color: colors.TEXT_DARK,
  },
  planPeriodWhite: {
    color: colors.WHITE,
  },
  // Buttons
  planButton: {
    borderRadius: Matrics.s(30),
    paddingVertical: Matrics.vs(15),
    alignItems: "center",
    marginBottom: Matrics.vs(20),
    marginTop: Matrics.vs(0),
    marginHorizontal: Matrics.s(20),
  },
  freeCurrentPlanPill: {
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(20),
    paddingHorizontal: Matrics.s(12),
    paddingVertical: Matrics.vs(4),
    // alignSelf: "flex-start",
  },
  proCurrentPlanPill: {
    backgroundColor: colors.WHITE,
    borderRadius: Matrics.s(20),
    paddingHorizontal: Matrics.s(12),
    paddingVertical: Matrics.vs(4),
  },
  freeCurrentPlanPillText: {
    fontSize: Matrics.ms(10),
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.WHITE,
    lineHeight: 14,
  },
  proCurrentPlanPillText: {
    fontSize: Matrics.ms(10),
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    lineHeight: 14,
  },
  currentPlanButton: {
    borderWidth: 1,
    borderColor: colors.TEXT_DARK,
    backgroundColor: "transparent",
  },
  buyPlanButton: {
    backgroundColor: colors.PRIMARY,
    marginTop: Matrics.vs(20),
  },
  buyPlanButtonDisabled: {
    opacity: 0.6,
  },
  planButtonText: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    lineHeight: 18,
  },
  currentPlanButtonText: {
    color: colors.TEXT_DARK,
  },
  buyPlanButtonText: {
    color: colors.WHITE,
  },
  // Features Section
  includedFeaturesTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    marginBottom: Matrics.vs(5),
  },
  freeIncludedFeaturesTitle: {
    marginTop: Matrics.vs(2),
    marginBottom: Matrics.vs(8),
  },
  includedFeaturesTitleDark: {
    color: colors.TEXT_PRIMARY,
  },
  includedFeaturesTitleWhite: {
    color: colors.WHITE,
    marginBottom: Matrics.vs(10),
  },
  featuresList: {
    gap: Matrics.vs(4),
  },
  freeFeaturesList: {
    gap: Matrics.vs(2),
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bulletPoint: {
    width: Matrics.s(4),
    height: Matrics.s(4),
    borderRadius: Matrics.s(4),
    marginTop: Matrics.vs(10),
    marginRight: Matrics.s(10),
  },
  bulletPointDark: {
    backgroundColor: colors.TEXT_DARK,
  },
  bulletPointWhite: {
    backgroundColor: colors.WHITE,
  },
  featureText: {
    flex: 1,
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    lineHeight: Matrics.vs(20),
  },
  featureTextDark: {
    color: colors.TEXT_DARK,
  },
  featureTextWhite: {
    color: colors.WHITE,
  },

  billingRow: {
    flexDirection: "row",
    gap: Matrics.s(10),
    marginTop: Matrics.vs(15),
    marginBottom: Matrics.vs(15),
  },
  billingPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  billingBox: {
    flex: 1,
    borderRadius: Matrics.s(12),
    paddingHorizontal: Matrics.s(10),
    paddingVertical: Matrics.vs(12),
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  billingBoxSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderColor: "rgba(255, 255, 255, 0.75)",
  },
  billingBoxUnselected: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  billingBoxLight: {
    flex: 1,
    borderRadius: Matrics.s(12),
    paddingHorizontal: Matrics.s(10),
    paddingVertical: Matrics.vs(12),
    backgroundColor: colors.WHITE,
    borderWidth: 1,
    borderColor: "rgba(31, 31, 31, 0.20)",
  },
  billingBoxLightSelected: {
    backgroundColor: "rgba(31, 31, 31, 0.04)",
    borderColor: "rgba(31, 31, 31, 0.50)",
  },
  billingBoxLightUnselected: {
    backgroundColor: colors.WHITE,
    borderColor: "rgba(31, 31, 31, 0.20)",
  },
  billingContentSelected: {
    opacity: 1,
  },
  billingContentUnselected: {
    opacity: 0.8,
  },
  billingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Matrics.vs(6),
  },
  billingTitle: {
    fontSize: Matrics.ms(13),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    lineHeight: 18,
  },
  billingTitleWhite: {
    color: colors.WHITE,
  },
  billingTitleMuted: {
    color: "rgba(255, 255, 255, 0.75)",
  },
  billingTitleDark: {
    color: colors.TEXT_PRIMARY,
  },
  billingAmount: {
    fontSize: Matrics.ms(14),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    lineHeight: 26,
  },
  billingAmountWhite: {
    color: colors.WHITE,
  },
  billingAmountMuted: {
    color: "rgba(255, 255, 255, 0.85)",
  },
  billingAmountDark: {
    color: colors.TEXT_PRIMARY,
  },
  billingSubText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    marginTop: Matrics.vs(2),
    lineHeight: 16,
  },
  billingSubTextWhite: {
    color: colors.WHITE,
  },
  billingSubTextMuted: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  billingSubTextDark: {
    color: colors.TEXT_PRIMARY,
    opacity: 0.8,
  },
  saveBadge: {
    backgroundColor: colors.WHITE,
    borderRadius: Matrics.s(16),
    paddingHorizontal: Matrics.s(6),
    paddingVertical: Matrics.vs(2),
  },
  saveBadgeDark: {
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(16),
    paddingHorizontal: Matrics.s(6),
    paddingVertical: Matrics.vs(2),
  },
  saveBadgeTextDark: {
    fontSize: Matrics.ms(10),
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: "700",
    color: colors.WHITE,
    lineHeight: 12,
  },
  saveBadgeText: {
    fontSize: Matrics.ms(10),
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: "700",
    color: colors.PRIMARY,
    lineHeight: 12,
  },
  // Terms and Conditions
  termsContainer: {
    marginTop: Matrics.vs(20),
    marginBottom: Matrics.vs(0),
  },
  termsTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(8),
  },
  termItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Matrics.vs(5),
  },
  termBullet: {
    width: Matrics.s(4),
    height: Matrics.s(4),
    borderRadius: Matrics.s(2),
    backgroundColor: colors.TEXT_DARK,
    marginTop: Matrics.vs(6),
    marginRight: Matrics.s(8),
    opacity: 0.7,
  },
  termText: {
    flex: 1,
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    fontWeight: "400",
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(14),
  },
  // Footer Links
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Matrics.s(20),
    marginTop: Matrics.vs(15),
    marginBottom: Matrics.vs(5),
  },
  footerLinkText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_PRIMARY,
    textDecorationLine: "underline",
  },
  helpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Matrics.vs(20),
  },
  helpText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    fontWeight: "400",
    color: colors.TEXT_DARK,
  },
  helpLinkText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_PRIMARY,
    textDecorationLine: "underline",
  },
});

export default Subscription;
