import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Image,
  ScrollView,
  ActivityIndicator
} from "react-native";
import CountryPicker, { Country, CountryCode } from "react-native-country-picker-modal";
import { BlurView } from "@react-native-community/blur";
import { useNavigation } from "@react-navigation/native";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import TextInput from "../common/TextInput";
import useTranslation from "../../hooks/useTranslation";
import { EMAIL_MAX_LENGTH, VERIFICATION_VIA } from "../../constants/commonConstant";
import { UserNavigationProp } from "../../interfaces/navigationTypes";
import { getFriendValidationSchema } from "../../validation/friend";
import { AddFriendFormData } from "../../interfaces/friendInterface";
import { sendInvite } from "../../services/friends";
import { toastMessageError, toastMessageSuccess } from "../common/ToastMessage";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
  onSendRequest: (email: string) => void;
  loading?: boolean;
  prefillPhone?: string;
  setSendingRequest?: (value: boolean) => void;
}
const AddFriendModal: React.FC<AddFriendModalProps> = ({
  visible,
  onClose,
  onSendRequest,
  loading = false,
  prefillPhone,
  setSendingRequest,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation<UserNavigationProp>();

  const [activeTab, setActiveTab] = useState<"email" | "phone">("phone");
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  const friendValidationSchema = useMemo(() => getFriendValidationSchema(t), [t]);

  const {
    handleSubmit,
    control,
    formState: { isValid },
    reset,
    setValue,
    watch,
  } = useForm<AddFriendFormData>({
    resolver: yupResolver<AddFriendFormData, any, AddFriendFormData>(friendValidationSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      method: "phone",
      email: "",
      country_code: "US",
      calling_code: "1",
      phone: "",
    },
  });

  const countryCode = watch("country_code") as CountryCode;
  const callingCode = watch("calling_code");

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate modal sliding up
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate modal sliding down
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      // Reset form when modal closes
      reset();
    }
  }, [visible, slideAnim, backdropOpacity, reset]);

  useEffect(() => {
    if (!visible) return;
    if (!prefillPhone) return;

    const digitsOnly = prefillPhone.replace(/\D+/g, "");

    setActiveTab(VERIFICATION_VIA.PHONE as "phone");
    setValue("method", VERIFICATION_VIA.PHONE as "phone", { shouldValidate: true });
    setValue("phone", digitsOnly, { shouldValidate: true });
  }, [prefillPhone, setValue, visible]);

  const sendMessage = async (phoneNumber: string) => {
    try {
      setSendingRequest?.(true);
      const data = {
        phoneNumber,
        countryCode:callingCode
      }
      const response = await sendInvite(data);
      if (response?.success) {
        toastMessageSuccess(response?.message || t("friends.invite_sent_successfully"));
      } else {
        toastMessageError(response?.message || t("common.something_went_wrong"));
      }
      handleClose();
    } catch (error) {
      toastMessageError(t("common.something_went_wrong"));
    } finally {
      setSendingRequest?.(false);
    }
  };

  const handleSendRequest = (data: AddFriendFormData) => {
    if (data.method === VERIFICATION_VIA.EMAIL && data.email.trim()) {
      onSendRequest(data.email.trim());
      return;
    }
    else if (data.method === VERIFICATION_VIA.PHONE && data.phone.trim()) {
      sendMessage(data.phone.trim());
      return;
    }
  };

  const handleClose = () => {
    setCountryPickerVisible(false);
    setActiveTab(VERIFICATION_VIA.PHONE as "phone");
    reset({
      method: VERIFICATION_VIA.PHONE as "phone",
      email: "",
      country_code: "US",
      calling_code: "1",
      phone: "",
    });
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        {/* Backdrop with blur effect */}
        <TouchableWithoutFeedback onPress={loading ? undefined : handleClose} disabled={loading}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          >
            <BlurView
              style={styles.blurView}
              blurType="light"
              blurAmount={20}
              reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.10)"
            />
            <View style={styles.blurOverlay} />
          </Animated.View>
        </TouchableWithoutFeedback>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{t("friends.add_friend.title")}</Text>
              <TouchableOpacity
                style={[styles.closeButton, loading && { opacity: 0.5 }]}
                onPress={handleClose}
                disabled={loading}
              >
                <View style={styles.closeIconContainer}>
                  <Image
                    source={Images.CLOSE_ICON}
                    style={styles.closeIcon}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.methodTabsWrapper}>
              <TouchableOpacity
                style={[styles.methodTab, activeTab === VERIFICATION_VIA.EMAIL ? styles.methodTabActive : styles.methodTabInactive]}
                onPress={() => {
                  setActiveTab("email");
                  setValue("method", "email", { shouldValidate: true });
                }}
                disabled={loading}
              >
                <Image
                  source={Images.MESSAGE_ICON}
                  style={[styles.methodTabIcon, activeTab === VERIFICATION_VIA.EMAIL ? styles.methodTabIconActive : styles.methodTabIconInactive]}
                  resizeMode="contain"
                />
                <Text style={[styles.methodTabText, activeTab === VERIFICATION_VIA.EMAIL ? styles.methodTabTextActive : styles.methodTabTextInactive]}>
                 {t("friends.add_friend.email_label")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodTab, activeTab === VERIFICATION_VIA.PHONE ? styles.methodTabActive : styles.methodTabInactive]}
                onPress={() => {
                  setActiveTab("phone");
                  setValue("method", "phone", { shouldValidate: true });
                }}
                disabled={loading}
              >
                <Image
                  source={Images.CALL_ICON}
                  style={[styles.methodTabIcon, activeTab === VERIFICATION_VIA.PHONE ? styles.methodTabIconActive : styles.methodTabIconInactive]}
                  resizeMode="contain"
                />
                <Text style={[styles.methodTabText, activeTab === VERIFICATION_VIA.PHONE ? styles.methodTabTextActive : styles.methodTabTextInactive]}>
                  {t("friends.add_friend.phone_label")}
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === VERIFICATION_VIA.EMAIL ? (
              <View style={styles.inputSection}>
                <TextInput
                  label={t("friends.add_friend.email_label")}
                  placeholder={t("friends.add_friend.email_placeholder")}
                  placeholderTextColor="rgba(26, 26, 26, 0.4)"
                  name="email"
                  control={control}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={EMAIL_MAX_LENGTH}
                  readOnly={loading}
                  containerStyle={styles.inputContainerStyle}
                  inputStyle={styles.input}
                />
              </View>
            ) : (
              <View style={styles.inputSection}>
                <TextInput
                  label={t("friends.add_friend.phone_label")}
                  placeholder={t("friends.add_friend.phone_placeholder")}
                  placeholderTextColor="rgba(26, 26, 26, 0.4)"
                  name="phone"
                  control={control}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={15}
                  allowPattern={/[0-9]/}
                  readOnly={loading}
                  containerStyle={styles.inputContainerStyle}
                  leftIcon={
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <CountryPicker
                        countryCode={countryCode}
                        countryCodes={["US", "GB", "CA", "NZ", "AU", "IE", "IN"]}
                        withFilter
                        withFlag
                        withCallingCode
                        withEmoji={false}
                        visible={countryPickerVisible}
                        onClose={() => setCountryPickerVisible(false)}
                        onSelect={(country: Country) => {
                          setValue("country_code", country.cca2 as CountryCode, {
                            shouldValidate: true,
                          });
                          setValue(
                            "calling_code",
                            String(country.callingCode?.[0] || ""),
                            { shouldValidate: true }
                          );
                        }}
                        containerButtonStyle={{ paddingVertical: 6, paddingHorizontal: 4 }}
                        onOpen={() => setCountryPickerVisible(true)}
                      />
                      <TouchableOpacity
                        onPress={() => setCountryPickerVisible(true)}
                        activeOpacity={0.7}
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text style={{ color: "rgba(47, 46, 44, 0.9)" }}>+{callingCode}</Text>
                       <Image source={Images.ARROW_DOWN} style={{width: 12, height: 12, marginStart: 5}} resizeMode="contain" />
                      </TouchableOpacity>
                    </View>
                  }
                  inputStyle={[styles.input, { paddingLeft: 110 }]}
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => {
                        if (loading) return;
                        handleClose();
                        navigation.navigate("ContactListing");
                      }}
                      disabled={loading}
                      style={styles.rightIconBtn}
                    >
                      <Image
                        source={Images.ADD_FRIEND_ICON}
                        style={styles.rightIconImg}
                      />
                    </TouchableOpacity>
                  }
                />
              </View>
            )}

            {/* Send Request Button */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!isValid || loading) && { opacity: 0.6 },
              ]}
              onPress={handleSubmit(handleSendRequest)}
              disabled={!isValid || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.WHITE} />
              ) : (
                <Text style={styles.sendButtonText}>{t("friends.add_friend.send_request")}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blurView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.10)",
  },
  modalContent: {
    backgroundColor: colors.WHITE,
    borderTopLeftRadius: Matrics.s(24),
    borderTopRightRadius: Matrics.s(24),
    paddingHorizontal: Matrics.s(20),
    paddingTop: Matrics.vs(20),
    paddingBottom: Matrics.vs(30),
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Matrics.vs(15),
  },
  methodTabsWrapper: {
    flexDirection: "row",
    alignSelf: "flex-start",
    borderRadius: Matrics.s(30),
    padding: Matrics.s(4),
    marginBottom: Matrics.vs(16),
  },
  methodTab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Matrics.s(30),
    paddingVertical: Matrics.vs(9),
    paddingHorizontal: Matrics.s(16),
    marginRight: Matrics.s(8),
  },
  methodTabActive: {
    backgroundColor: colors.PRIMARY,
  },
  methodTabInactive: {
    backgroundColor: "#EFEFEF",
  },
  methodTabText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
  },
  methodTabTextActive: {
    color: colors.WHITE,
  },
  methodTabTextInactive: {
    color: "rgba(0,0,0,0.55)",
  },
  methodTabIcon: {
    width: Matrics.s(16),
    height: Matrics.s(16),
    marginRight: Matrics.s(8),
  },
  methodTabIconActive: {
    tintColor: colors.WHITE,
  },
  methodTabIconInactive: {
    tintColor: "rgba(0,0,0,0.55)",
  },
  methodIconTextWrapper: {
    width: Matrics.s(16),
    height: Matrics.s(16),
    marginRight: Matrics.s(8),
    alignItems: "center",
    justifyContent: "center",
  },
  methodIconText: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    lineHeight: Matrics.vs(16),
  },
  methodIconTextActive: {
    color: colors.WHITE,
  },
  methodIconTextInactive: {
    color: "rgba(0,0,0,0.55)",
  },
  title: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
  },
  closeButton: {
    padding: Matrics.s(1),
  },
  closeIconContainer: {
    width: Matrics.s(20),
    height: Matrics.s(20),
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    width: "100%",
    height: "100%",
  },
  inputSection: {
    marginBottom: Matrics.vs(20),
  },
  inputContainerStyle: {
    marginBottom: 0,
  },
  input: {
    paddingHorizontal: Matrics.s(16),
    paddingVertical: Matrics.vs(14),
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.TEXT_PRIMARY,
  },
  rightIconBtn: {
    width: Matrics.ms(28),
    height: Matrics.ms(28),
    alignItems: "center",
    justifyContent: "center",
  },
  rightIconImg: {
    width: 22,
    height: 22,
    objectFit: "contain",
  },
  sendButton: {
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(30),
    paddingVertical: Matrics.vs(15),
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  sendButtonText: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.WHITE,
    lineHeight: Matrics.vs(16),
  },
});

export default AddFriendModal;
