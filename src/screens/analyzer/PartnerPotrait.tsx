import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import CommonSearchBar from "../../components/common/CommonSearchBar";
import {
  colors,
  FontsSize,
  Matrics,
  typography,
} from "../../config/appStyling";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { AnalyzerNavigationProp, AnalyzerStackParamList } from "../../interfaces/navigationTypes";
import useTranslation from "../../hooks/useTranslation";
import { getInitials, getTitleCase } from "../../utils/helper";
import { ANALYZER_SEARCH_DEBOUNCE_MS } from "../../constants/commonConstant";
import useAuth from "../../hooks/useAuth";
import FullPageLoader from "../../components/common/FullPageLoader";
import profileService from "../../services/profileService";
import { ILoveProfile } from "../../interfaces/profileInterfaces";
import { toastMessageUpgrade } from "../../components/common/ToastMessage";

interface Profile {
  id: string;
  name: string;
  age: number;
  gender: string;
  relationship: string;
}

const PartnerPotrait: React.FC = () => {
  const navigation = useNavigation<AnalyzerNavigationProp>();
  const route = useRoute<RouteProp<AnalyzerStackParamList, "PartnerPortrait">>();
  const { t } = useTranslation();
  const {authData} = useAuth();
  const currentPlan = authData?.plan;
  const routeProfiles = route.params?.profiles ?? [];
  const routeAnalysisCount = route.params?.analysisCount ?? 0;
  
  const [profileData, setProfileData] = useState<ILoveProfile[]>(routeProfiles);
  const [isLoading, setIsLoading] = useState(routeProfiles.length === 0);

  const [analysisCount, setAnalysisCount] = useState(routeAnalysisCount);

  useEffect(() => {
    if (routeProfiles.length === 0) {
      const fetchProfiles = async () => {
        try {
          const response = await profileService.getProfiles();
          if (response.success && response.data) {
            setProfileData(response.data);
            setAnalysisCount(Number(response.extra_data?.analysis_count ?? 0));
          }
        } catch (error) {
          console.error("Error fetching profiles", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProfiles();
    }
  }, []);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const profiles: Profile[] = useMemo(() => {
    return profileData.map((profile) => {
      const name = profile.full_name;
      const initials = getInitials(name);

      return {
        id: String(profile.id),
        name,
        age: profile.age,
        gender: profile.gender,
        relationship: profile.relationship_tag,
        initials,
      };
    });
  }, [profileData]);

  // Debounce search text to optimize performance
  useEffect(() => {
    // Clear existing timer if user types again
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer to update debounced value
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, ANALYZER_SEARCH_DEBOUNCE_MS);

    // Cleanup function to clear timer on unmount or when searchText changes
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchText]);

  // Memoize filtered profiles to avoid unnecessary recalculations
  const filteredProfiles = useMemo(() => {
    if (!debouncedSearchText.trim()) {
      return profiles;
    }

    const searchLower = debouncedSearchText.toLowerCase().trim();
    return profiles.filter((profile) => {
      const fullName = (profile.name ?? "").toLowerCase().trim();
      const nameMatch = fullName.includes(searchLower);

      return nameMatch;
    });
  }, [profiles, debouncedSearchText]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text.toLowerCase());
  }, []);

  const handleSearchPress = useCallback(() => {
    // The search is already handled by the debounced effect
    // This is kept for consistency with the CommonSearchBar component
  }, []);

  const handleProfileSelect = useCallback((profile: Profile) => {
 
    const monthlyLimitRaw = currentPlan?.limits?.analyzer_limit;
    const monthlyLimit = monthlyLimitRaw === null || monthlyLimitRaw === undefined
      ? null
      : Number(monthlyLimitRaw);
    const usedThisMonth = Number(analysisCount ?? 0);

    if (monthlyLimit !== null && Number.isFinite(monthlyLimit) && usedThisMonth >= monthlyLimit) {
      toastMessageUpgrade(
        t("analyzer.portrait.analysis_limit_reached"),
        t("analyzer.portrait.analysis_limit_reached_message"),
        t("analyzer.portrait.upgrade_for_more"),
        () => {
          const parentNav = navigation.getParent?.();
          if (parentNav) {
            parentNav.navigate("SettingsTab", {
              screen: "Subscription",
              params: {
                navigationFrom: {
                  tab: "FilesTab",
                  screen: route?.name,
                },
              },
            });
            return;
          }
          (navigation as any).navigate?.("Subscription", {
            navigationFrom: {
              tab: "FilesTab",
              screen: route?.name,
            },
          });
        },
      );
      return;
    } 
    else {
      navigation.navigate("PartnerPortraitResult", { profile });
    }
  }, [analysisCount, currentPlan?.limits?.analyzer_limit, navigation, route?.name, t]);

  const renderProfileItem = useCallback(({ item, index }: { item: Profile; index: number }) => (
    <TouchableOpacity
      style={[
        styles.profileCard,
        index === filteredProfiles.length - 1 && styles.profileLastCard,
      ]}
      onPress={() => handleProfileSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.profileContent}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          </View>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{getTitleCase(item.name)}</Text>
          <View style={styles.profileDetails}>
            <View style={styles.detailTag}>
              <Text style={styles.detailText}>{item.age}</Text>
            </View>
            <View style={styles.detailTag}>
              <Text style={styles.detailText}>{item.gender}</Text>
            </View>
            <View style={styles.detailTag}>
              <Text style={styles.detailText}>{item.relationship}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  ), [filteredProfiles.length, handleProfileSelect]);

  return (
    <LinearGradient
      colors={['rgba(255, 255, 255, 1)', 'rgba(226, 232, 252)']}
      locations={[0.1977, 1]}
      style={styles.container}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={false}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <FullPageLoader showAnimatedText={false}/>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleSection}>
            <Text style={styles.title}>{t("analyzer.portrait.pick_profile")}</Text>
            <Text style={styles.subtitle}>
              {t("analyzer.portrait.pick_profile_message")}
            </Text>
          </View>
          <View style={{ width: "100%" }}>
            <CommonSearchBar
              placeholder={t("love_profile.search_profile")}
              value={searchText}
              onChangeText={handleSearchChange}
              onSearchPress={handleSearchPress}
              containerStyle={{ marginHorizontal: Matrics.s(0) }}
              disabled={profiles.length === 0}
            />

            {profiles.length === 0 ? (
              <Text style={styles.emptyText}>
                {t("analyzer.portrait.no_profiles_available")}
              </Text>
            ) : filteredProfiles.length === 0 ? (
              <Text style={styles.emptyText}>
                {t("love_profile.no_profiles_found")}
              </Text>
            ) : (
              <FlatList
                data={filteredProfiles}
                renderItem={renderProfileItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Matrics.ms(20),
    paddingTop: Matrics.vs(5),
    paddingBottom: Matrics.vs(40),
  },
  titleSection: {
    marginBottom: Matrics.vs(0),
  },
  title: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(5),
  },
  subtitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(18),
  },
  listContainer: {
    paddingBottom: Matrics.vs(20),
    paddingTop: Matrics.vs(10),
  },
  emptyText: {
    marginTop: Matrics.vs(20),
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    textAlign: "center",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingVertical: Matrics.vs(14),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(31, 31, 31, 0.08)",
  },
  profileLastCard: {
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    marginRight: Matrics.s(12),
  },
  avatar: {
    width: Matrics.s(45),
    height: Matrics.s(45),
    borderRadius: Matrics.s(100),
    backgroundColor: "rgba(26, 26, 26, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.TEXT_DARK,
    fontWeight: "600",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(4),
    fontWeight: "600",
  },
  profileDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: Matrics.s(8),
  },
  detailTag: {
    backgroundColor: "rgba(146, 129, 233, 0.10)",
    paddingVertical: Matrics.vs(4),
    paddingHorizontal: Matrics.s(10),
    borderRadius: Matrics.s(100),
  },
  detailText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
  },
  searchSkeleton: {
    height: Matrics.vs(50),
    borderRadius: Matrics.s(12),
    backgroundColor: "rgba(26, 26, 26, 0.06)",
    marginTop: Matrics.vs(12),
  },
  skeletonCard: {
    opacity: 0.9,
  },
  avatarSkeleton: {
    width: Matrics.s(45),
    height: Matrics.s(45),
    borderRadius: Matrics.s(100),
    backgroundColor: "rgba(26, 26, 26, 0.06)",
  },
  nameSkeleton: {
    height: Matrics.vs(14),
    borderRadius: Matrics.s(6),
    backgroundColor: "rgba(26, 26, 26, 0.06)",
    width: "60%",
    marginBottom: Matrics.vs(10),
  },
  tagsRowSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Matrics.s(8),
  },
  tagSkeleton: {
    height: Matrics.vs(18),
    borderRadius: Matrics.s(100),
    backgroundColor: "rgba(146, 129, 233, 0.10)",
    width: Matrics.s(56),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: Matrics.screenHeight * 0.8,
  },
});

export default PartnerPotrait;
