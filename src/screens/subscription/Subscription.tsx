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
  Image,
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
  FREE,
} from "../../constants/commonConstant";
import useAuth from "../../hooks/useAuth";
import { useTranslation } from "react-i18next";
import Images from "../../config/Images";

type ProBillingCycle = "monthly" | "yearly";

type ProTier = "premium" | "premium_plus";

type SelectedPlan = {
  tier: ProTier;
  cycle: ProBillingCycle;
} | null;

type TabType = "free" | "premium" | "premium_plus";

const Subscription = ({ navigation }: ScreenProps) => {
  const { t } = useTranslation();
  const { authData } = useAuth();

  const [plans, setPlans] = useState<ISubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>(null);
  const [activeTab, setActiveTab] = useState<TabType>(PREMIUM);

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

  useEffect(() => {
    if (isCurrentPremiumPlus) {
      setActiveTab(PREMIUM_PLUS);
    } else if (isCurrentPremium) {
      setActiveTab(PREMIUM);
    } else {
      setActiveTab(FREE);
    }
  }, [isCurrentPremium, isCurrentPremiumPlus]);

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
          const formattedPrice = typeof price === 'number' 
            ? price.toFixed(2) 
            : parseFloat(price).toFixed(2);
          return `${currency} ${formattedPrice}`;
        }
      }

      const dbCurrency = plan?.currency;
      const dbPrice = plan?.price;
      if (dbCurrency && dbPrice) {
        const formattedPrice = typeof dbPrice === 'number' 
          ? dbPrice.toFixed(2) 
          : parseFloat(dbPrice).toFixed(2);
        return `${dbCurrency} ${formattedPrice}`;
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

  const renderFeatureItem = (featureText: string, index: number) => (
    <View key={index} style={styles.featureItem}>
      <View style={styles.bulletPoint} />
      <Text style={styles.featureText}>{featureText}</Text>
    </View>
  );

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err),
    );
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedPlan(null);
  };

  const renderPremiumCard = (
    tier: ProTier,
    icon: any,
    title: string,
    subtitle: string,
    everythingInText: string,
    monthlyPlan: ISubscriptionPlan | undefined,
    yearlyPlan: ISubscriptionPlan | undefined,
    isCurrentPlan: boolean,
    isDisabled: boolean,
    gradientColors: string[],
  ) => (
    <View style={[styles.planCard, styles.premiumPlanCard]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View  style={styles.gradientHeader}>
        {isCurrentPlan && (
          <View style={styles.currentPlanBadgeWhite}>
            <Text style={styles.currentPlanBadgeTextDark}>
              {t("subscription.current_plan")}
            </Text>
          </View>
        )}
        <View style={styles.cardHeader}>
          <Image source={icon} style={styles.planIconWhite} />
          <View style={styles.cardHeaderTextContainer}>
            <Text style={styles.planTitleWhite}>{title}</Text>
            <Text style={styles.planSubtitleWhite}>{subtitle}</Text>
          </View>
        </View>
        </View>
      </LinearGradient>

      <View style={styles.cardContentWhite}>
        <Text style={styles.everythingInText}>{everythingInText}</Text>
        <View style={styles.featuresList}>
          {normalizeFeatures(
            (selectedPlan?.tier === tier &&
            selectedPlan?.cycle === BILLING_CYCLE.YEARLY
              ? yearlyPlan
              : monthlyPlan
            )?.features,
          ).map((featureText, index) => renderFeatureItem(featureText, index))}
        </View>

        <View style={styles.billingRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.billingBoxLight,
              selectedPlan?.tier === tier &&
              selectedPlan?.cycle === BILLING_CYCLE.MONTHLY
                ? styles.billingBoxLightSelected
                : styles.billingBoxLightUnselected,
            ]}
            disabled={isYearlySubscriber || isDisabled}
            onPress={() => onSelectPlan(tier, BILLING_CYCLE.MONTHLY)}
          >
            <Text style={styles.billingTitleDark}>
              {t("subscription.monthly")}
            </Text>
            <View style={styles.billingPriceRow}>
              <Text style={styles.billingAmountDark}>
                {monthlyPlan ? getPlanPriceLabel(monthlyPlan) : ""}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.billingBoxLight,
              selectedPlan?.tier === tier &&
              selectedPlan?.cycle === BILLING_CYCLE.YEARLY
                ? styles.billingBoxLightSelected
                : styles.billingBoxLightUnselected,
            ]}
            onPress={() => onSelectPlan(tier, BILLING_CYCLE.YEARLY)}
            disabled={isDisabled}
          >
            <View style={styles.billingTitleRow}>
              <Text style={styles.billingTitleDark}>
                {t("subscription.yearly")}
              </Text>
              <View style={styles.saveBadgeDark}>
                <Text style={styles.saveBadgeTextWhite}>
                  {t("subscription.save")}{" "}
                  {monthlyPlan && yearlyPlan
                    ? Math.round(
                        100 -
                          (Number(yearlyPlan.price) /
                            (Number(monthlyPlan.price) * 12)) *
                            100,
                      )
                    : 0}
                  %
                </Text>
              </View>
            </View>
            <View style={styles.billingPriceRow}>
              <Text style={styles.billingAmountDark}>
                {yearlyPlan ? getPlanPriceLabel(yearlyPlan) : ""}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTabSwitcher = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, styles.tabFree]}
        onPress={() => handleTabChange(FREE)}
        activeOpacity={0.7}
      >
        {activeTab === FREE ? (
          <View style={styles.activeTabGradient}>
            <Text style={styles.activeTabText} numberOfLines={1}>
              {t("subscription.free")}
            </Text>
          </View>
        ) : (
          <Text style={styles.tabText} numberOfLines={1}>
            {t("subscription.free")}
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, styles.tabPremium]}
        onPress={() => handleTabChange(PREMIUM)}
        activeOpacity={0.7}
      >
        {activeTab === PREMIUM ? (
         <View style={styles.activeTabGradient}>
            <Text style={styles.activeTabText} numberOfLines={1}>
              {t("subscription.premium")}
            </Text>
         </View>
        ) : (
          <Text style={styles.tabText} numberOfLines={1}>
            {t("subscription.premium")}
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, styles.tabPremiumPlus]}
        onPress={() => handleTabChange(PREMIUM_PLUS)}
        activeOpacity={0.7}
      >
        {activeTab === PREMIUM_PLUS ? (
          <View style={styles.activeTabGradient}>
            <Text style={styles.activeTabText} numberOfLines={1}>
              {t("subscription.premium_plus")}
            </Text>
         </View>
        ) : (
          <Text style={styles.tabText} numberOfLines={1}>
            {t("subscription.premium_plus")}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => (
    <>
      {/* Free Plan Card */}
      {activeTab === FREE && freePlan && (
        <View style={[styles.planCard, styles.freePlanCard]}>
          {!authData?.plan?.product_id && (
            <View style={styles.currentPlanBadge}>
              <Text style={styles.currentPlanBadgeText}>
                {t("subscription.current_plan")}
              </Text>
            </View>
          )}
          <View style={styles.freeCardTopRow}>
            <View style={styles.freeCardLeft}>
              <Image source={Images.FREE_ICON} style={styles.planIcon} />
              <View style={styles.freeCardTitleContainer}>
                <Text style={styles.planTitle}>{t("subscription.free")}</Text>
                <Text style={styles.planSubtitle}>
                  {t("subscription.enjoy_basic_features")}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.featuresList}>
            {normalizeFeatures(freePlan.features).map((featureText, index) =>
              renderFeatureItem(featureText, index),
            )}
          </View>
        </View>
      )}

      {/* Premium Plan Card */}
      {activeTab === PREMIUM &&
        premiumMonthlyPlan &&
        renderPremiumCard(
          PREMIUM,
          Images.PREMIUM_ICON,
          t("subscription.premium"),
          t("subscription.smarter_relationship_insights"),
          t("subscription.everything_in_free_plus"),
          premiumMonthlyPlan,
          premiumYearlyPlan,
          isCurrentPremium,
          isCurrentPremiumPlus,
          ["#4D6EF5", "#4D6EF5"],
        )}

      {/* Premium Plus Plan Card */}
      {activeTab === PREMIUM_PLUS &&
        premiumPlusMonthlyPlan &&
        renderPremiumCard(
          PREMIUM_PLUS,
          Images.PREMIUM_PLUS_ICON,
          t("subscription.premium_plus"),
          t("subscription.ultimate_relationship_analysis"),
          t("subscription.everything_in_premium_plus"),
          premiumPlusMonthlyPlan,
          premiumPlusYearlyPlan,
          isCurrentPremiumPlus,
          authData?.plan?.product_id === SUBSCRIPTION_PLAN.PREMIUM_PLUS_YEARLY,
          ["#3460FB", "#A4B9FF"],
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
            {renderTabSwitcher()}
            {renderContent()}

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
              {loading ? t("subscription.processing") : t("subscription.buy_now")}
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
    alignSelf: "center",
    backgroundColor: "rgba(239, 239, 239, .6)",
    borderRadius: Matrics.s(100),
    marginHorizontal: Matrics.s(20),
    marginBottom: Matrics.vs(20),
    marginTop: Matrics.vs(0),
    padding: Matrics.s(0),
    width: "100%",
  },
  tab: {
    borderRadius: Matrics.s(100),
    overflow: "hidden",
  },
  tabFree: {
    flex: 0.8,
  },
  tabPremium: {
    flex: 1,
  },
  tabPremiumPlus: {
    flex: 1.2,
  },
  activeTabGradient: {
    paddingVertical: Matrics.vs(10),
    // paddingHorizontal: Matrics.s(4),
    borderRadius: Matrics.s(100),
    alignItems: "center",
    justifyContent: "center",
    opacity: 1,
    lineHeight: Matrics.vs(14),
    backgroundColor: colors.PRIMARY,
  },
  tabText: {
    fontSize: Matrics.ms(13),
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: "#1F1F1F",
    textAlign: "center",
    paddingVertical: Matrics.vs(12),
    // paddingHorizontal: Matrics.s(4),
    opacity: 0.6,
    lineHeight: Matrics.vs(14),
  },
  activeTabText: {
    fontSize: Matrics.ms(13),
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: "#FFFFFF",
    textAlign: "center",
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
    borderRadius: Matrics.s(16),
    marginBottom: Matrics.vs(16),
    overflow: "hidden",
    borderColor: "rgba(31, 31, 31, 0.20)",
    borderWidth: 1,
  },
  freePlanCard: {
    backgroundColor: colors.WHITE,
    borderColor: "rgba(31, 31, 31, 0.20)",
    borderWidth: 1,
    padding: Matrics.s(20),
  },
  freeCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Matrics.vs(15),
  },
  freeCardLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  freeCardTitleContainer: {
    marginLeft: Matrics.s(12),
    flex: 1,
  },
  premiumPlanCard: {
    backgroundColor: colors.WHITE,
    borderColor: "rgba(31, 31, 31, 0.12)",
    borderWidth: 1,
  },
  // Card Header
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Matrics.vs(15),
  },
  cardHeaderTextContainer: {
    flex: 1,
    marginLeft: Matrics.s(8),
  },
  planIcon: {
    width: Matrics.s(52),
    height: Matrics.s(52),
    resizeMode: "contain",
  },
  planIconWhite: {
    width: Matrics.s(52),
    height: Matrics.s(52),
    resizeMode: "contain",
    tintColor: colors.WHITE,
  },
  planTitle: {
    fontSize: Matrics.ms(30),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    lineHeight: Matrics.vs(32),
    marginBottom: Matrics.vs(5),
  },
  planTitleWhite: {
    fontSize: Matrics.ms(30),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.WHITE,
    lineHeight: Matrics.vs(32),
  },
  planSubtitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
    marginTop: Matrics.vs(0),
  },
  planSubtitleWhite: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.SemiBold,
    color: colors.WHITE,
    marginTop: Matrics.vs(2),
  },
  // Current Plan Badge
  currentPlanBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(25),
    paddingHorizontal: Matrics.s(18),
    paddingVertical: Matrics.vs(6),
    marginBottom: Matrics.vs(15),
  },
  currentPlanBadgeText: {
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "500",
    color: colors.WHITE,
    fontSize: Matrics.s(11),
    lineHeight: Matrics.s(15),
  },
  currentPlanBadgeWhite: {
    backgroundColor: colors.WHITE,
    borderRadius: Matrics.s(25),
    paddingHorizontal: Matrics.s(18),
    paddingVertical: Matrics.vs(6),
    alignSelf: "flex-start",
    marginBottom: Matrics.vs(15),
  },
  currentPlanBadgeTextDark: {
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "500",
    color: colors.PRIMARY,
    fontSize: Matrics.s(11),
    lineHeight: Matrics.s(15),
  },
  // Gradient Header for Premium Cards
  gradientHeader: {
    paddingVertical: Matrics.s(24),
    paddingHorizontal: Matrics.s(16),
    paddingBottom: Matrics.vs(28),
  },
  cardContentWhite: {
    backgroundColor: colors.WHITE,
    padding: Matrics.s(20),
    borderTopStartRadius: Matrics.s(20),
    borderTopEndRadius: Matrics.s(20),
    marginTop: Matrics.s(-20),
  },
  everythingInText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(10),
  },
  // Features Section
  featuresList: {
    gap: Matrics.vs(3),
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bulletPoint: {
    width: Matrics.s(4),
    height: Matrics.s(4),
    borderRadius: Matrics.s(2),
    backgroundColor: colors.TEXT_DARK,
    marginTop: Matrics.vs(8),
    marginRight: Matrics.s(10),
  },
  featureText: {
    flex: 1,
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(20),
  },
  // Billing Options
  billingRow: {
    flexDirection: "row",
    gap: Matrics.s(10),
    marginTop: Matrics.vs(20),
  },
  billingPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: Matrics.vs(4),
  },
  billingBox: {
    flex: 1,
    borderRadius: Matrics.s(12),
    paddingHorizontal: Matrics.s(10),
    paddingVertical: Matrics.vs(10),
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  billingBoxSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderColor: colors.WHITE,
  },
  billingBoxUnselected: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  billingBoxLight: {
    flex: 1,
    borderRadius: Matrics.s(16),
    paddingHorizontal: Matrics.s(12),
    paddingVertical: Matrics.vs(12),
    backgroundColor: colors.WHITE,
    borderWidth: 1,
    borderColor: "rgba(31, 31, 31, 0.20)",
  },
  billingBoxLightSelected: {
    backgroundColor: colors.WHITE,
    borderColor: colors.PRIMARY,
    borderWidth: 1,
    opacity: 1,
  },
  billingBoxLightUnselected: {
    backgroundColor: colors.WHITE,
    borderColor: "rgba(31, 31, 31, 0.20)",
    borderWidth: 1,
    opacity: 0.6,
  },
  billingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Matrics.vs(4),
  },
  billingTitle: {
    fontSize: Matrics.ms(13),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.WHITE,
  },
  billingTitleDark: {
    fontSize: Matrics.ms(13),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
  },
  billingAmount: {
    fontSize: Matrics.ms(16),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.WHITE,
  },
  billingAmountDark: {
    fontSize: Matrics.ms(16),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
  },
  billingSubText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.7)",
  },
  billingSubTextDark: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    opacity: 0.7,
  },
  saveBadge: {
    backgroundColor: colors.WHITE,
    borderRadius: Matrics.s(12),
    paddingHorizontal: Matrics.s(6),
    paddingVertical: Matrics.vs(2),
  },
  saveBadgeText: {
    fontSize: Matrics.ms(9),
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: "700",
    color: colors.PRIMARY,
  },
  saveBadgeDark: {
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(12),
    paddingHorizontal: Matrics.s(6),
    paddingVertical: Matrics.vs(2),
  },
  saveBadgeTextWhite: {
    fontSize: Matrics.ms(9),
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: "700",
    color: colors.WHITE,
  },
  // Buttons
  planButton: {
    borderRadius: Matrics.s(30),
    paddingVertical: Matrics.vs(15),
    alignItems: "center",
    marginBottom: Matrics.vs(20),
    marginHorizontal: Matrics.s(20),
  },
  buyPlanButton: {
    backgroundColor: colors.PRIMARY,
    marginTop: Matrics.vs(10),
  },
  buyPlanButtonDisabled: {
    opacity: 0.6,
  },
  planButtonText: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
  },
  buyPlanButtonText: {
    color: colors.WHITE,
  },
  // Terms and Conditions
  termsContainer: {
    marginTop: Matrics.vs(30),
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
    justifyContent: "flex-start",
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
    justifyContent: "flex-start",
    alignItems: "center",
    flexWrap: "wrap",
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
