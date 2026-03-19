import React, { useState, useEffect, useRef } from "react";
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
  FlatList,
  ActivityIndicator
} from "react-native";
import { BlurView } from "@react-native-community/blur";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import { IFriendResponse } from "../../interfaces/groupInterface";
import { toastMessageError, toastMessageSuccess } from "../common/ToastMessage";
import groupService from "../../services/groupService";
import useTranslation from "../../hooks/useTranslation";
import { CDN_IMAGE_URL, FRIEND_NAME_TRUNCATE_LENGTH, NAME_TRUNCATION_SUFFIX } from "../../constants/commonConstant";


const { height: SCREEN_HEIGHT } = Dimensions.get("window");


interface AddPeopleModalProps {
  visible: boolean;
  onClose: () => void;
  availablePeople: IFriendResponse[];
  onAddPeople: () => void;
  groupId: number
  isLoading: boolean
}

const AddPeopleModal: React.FC<AddPeopleModalProps> = ({
  visible,
  onClose,
  availablePeople,
  onAddPeople,
  groupId,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [selectedPeople, setSelectedPeople] = useState<IFriendResponse[]>([]);
  const [addMemberLoading, setMemberLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const getInitials = (name: string): string => {
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    if (visible) {
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
      // Reset selection when modal closes
      setSelectedPeople([]);
    }
  }, [visible, slideAnim, backdropOpacity]);

  const handleDone = async () => {
    setMemberLoading(true)
    if (selectedPeople.length > 0) {
      try {
        const response = await groupService.addFriendsInGroup({
          group_id: groupId,
          members: selectedPeople.map((person) => person.friend_id)
        })

        if (!response.success) {
          toastMessageError(response.message)
        } else {
          toastMessageSuccess(response.message)
          onAddPeople();
        }
      } catch (error) {
        toastMessageError(t("common.something_went_wrong"), t("group.add_people.error_try_again_later"))
      } finally {
        setMemberLoading(false)
        onClose();
      }

    } else {
      setMemberLoading(false)
      toastMessageError(t("common.something_went_wrong"), t("group.add_people.error_select_one"))
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedPeople([]);
    onClose();
  };

  const togglePerson = (person: IFriendResponse) => {
    const isSelected = selectedPeople.some((selectedPerson) => selectedPerson.id === person.id);
    if (isSelected) {
      setSelectedPeople(selectedPeople.filter((selectedPerson) => selectedPerson.id !== person.id));
    } else {
      setSelectedPeople([...selectedPeople, person]);
    }
  };

  const removePerson = (personId: number) => {
    setSelectedPeople(selectedPeople.filter((selectedPerson) => selectedPerson.friend_id !== personId));
  };

  const isPersonSelected = (personId: number) => {
    return selectedPeople.some((selectedPerson) => selectedPerson.friend_id === personId);
  };

  const renderPersonItem = ({
    item,
    index,
  }: {
    item: IFriendResponse;
    index: number;
  }) => {
    const isSelected = isPersonSelected(item.friend_id);

    return (
      <TouchableOpacity
        style={[
          styles.personItem,
          index === availablePeople.length - 1 && styles.noBorder,
        ]}
        onPress={() => togglePerson(item)}
        activeOpacity={0.7}
        disabled={addMemberLoading}
      >
        {item.image ? (
          <Image
            source={{ uri: CDN_IMAGE_URL+item.image }}
            style={styles.personAvatar}
          />
        ) : (
          <View style={styles.personInitials}>
            <Text style={styles.personInitialsText}>{getInitials(item.full_name)}</Text>
          </View>
        )}
        <Text style={styles.personName}>{item.full_name}</Text>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <Image
              source={Images.CHECK_ICON}
              style={styles.checkIcon}
              resizeMode="contain"
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        {/* Backdrop with blur effect */}
        <TouchableWithoutFeedback onPress={handleClose}>
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t("group.add_people.title")}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <View style={styles.closeIconContainer}>
                <Image
                  source={Images.CLOSE_ICON}
                  style={styles.closeIcon}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>
          </View>
          {isLoading ?
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.PRIMARY} />
            </View> :
            <>
              {/* Selected People Chips */}
              {selectedPeople.length > 0 && (
                <View style={styles.selectedSection}>
                  <Text style={styles.toLabel}>{t("group.add_people.to")}</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.selectedScrollContent}
                  >
                    {selectedPeople.map((person) => (
                      <View key={person.id} style={styles.personChip}>
                        {person.image ? (
                          <Image
                            source={{ uri: CDN_IMAGE_URL+person.image }}
                            style={styles.chipAvatar}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.chipInitials}>
                            <Text style={styles.chipInitialsText}>
                              {getInitials(person.full_name)}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.chipName} numberOfLines={1}>
                          {person.full_name.length > FRIEND_NAME_TRUNCATE_LENGTH
                            ? person.full_name.substring(0, FRIEND_NAME_TRUNCATE_LENGTH) + NAME_TRUNCATION_SUFFIX
                            : person.full_name}
                        </Text>
                        <TouchableOpacity
                          style={styles.chipRemove}
                          onPress={() => removePerson(person.friend_id)}
                          disabled={addMemberLoading}
                        >
                          <Image
                            source={Images.CLOSE_ICON2}
                            style={styles.chipRemoveIcon}
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                  {/* Dash Border Separator */}
                  <Image
                    source={Images.DASH_BORDER}
                    style={styles.dashedSeparator}
                    resizeMode="contain"
                  />
                </View>
              )}

              {/* People List */}
              {availablePeople.length > 0 ?
                <>
                  <FlatList
                    data={availablePeople}
                    renderItem={renderPersonItem}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    style={styles.peopleList}
                    contentContainerStyle={styles.peopleListContent}
                  />
                  {/* Done Button */}
                  <TouchableOpacity
                    style={[
                      styles.doneButton,
                      (selectedPeople.length === 0 || addMemberLoading) && { opacity: 0.6 },
                    ]}
                    onPress={handleDone}
                    disabled={selectedPeople.length === 0 || addMemberLoading}
                  >
                    {addMemberLoading ? <ActivityIndicator size="small" color={colors.WHITE} /> : <Text style={styles.doneButtonText}>{t("group.add_people.done")}</Text>}
                  </TouchableOpacity>
                </>
                : <Text style={styles.noPeopleText}>{t("group.add_people.no_people")}</Text>}


            </>}
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
    ...StyleSheet.absoluteFillObject,
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: colors.WHITE,
    borderTopLeftRadius: Matrics.s(30),
    borderTopRightRadius: Matrics.s(30),
    paddingTop: Matrics.vs(20),
    paddingHorizontal: Matrics.s(20),
    paddingBottom: Matrics.vs(20),
    minHeight: SCREEN_HEIGHT * 0.7,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Matrics.vs(10),
  },
  title: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    lineHeight: Matrics.vs(18),
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
  selectedSection: {
    marginBottom: Matrics.vs(15),
  },
  toLabel: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(10),
  },
  selectedScrollContent: {
    flexDirection: "row",
    gap: Matrics.s(10),
    paddingBottom: Matrics.vs(5),
  },
  personChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(47, 89, 235, 0.20)",
    borderRadius: Matrics.s(25),
    paddingLeft: Matrics.s(9),
    paddingRight: Matrics.s(9),
    paddingVertical: Matrics.vs(6),
  },
  chipAvatar: {
    width: Matrics.s(20),
    height: Matrics.s(20),
    borderRadius: Matrics.s(14),
    marginRight: Matrics.s(6),
  },
  chipInitials: {
    width: Matrics.s(20),
    height: Matrics.s(20),
    borderRadius: Matrics.s(100),
    backgroundColor: colors.GRAY_MEDIUM,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Matrics.s(7),
  },
  chipInitialsText: {
    fontSize: Matrics.ms(10),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
  },
  chipName: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Bold,
    lineHeight: Matrics.vs(16),
    fontWeight: "500",
    color: colors.TEXT_DARK,
    marginRight: Matrics.s(10),
  },
  chipRemove: {
    width: Matrics.s(14),
    height: Matrics.s(14),
    borderRadius: Matrics.s(8),
    alignItems: "center",
    justifyContent: "center",
  },
  chipRemoveIcon: {
    width: "100%",
    height: "100%",
  },
  dashedSeparator: {
    width: "100%",
    height: Matrics.vs(1),
    marginBottom: Matrics.vs(0),
    marginTop: Matrics.vs(15),
  },
  peopleList: {
    flex: 1,
  },
  peopleListContent: {
    paddingBottom: Matrics.vs(10),
  },
  personItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Matrics.vs(12),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  personAvatar: {
    width: Matrics.s(32),
    height: Matrics.s(32),
    borderRadius: Matrics.s(100),
    marginRight: Matrics.s(10),
  },
  personInitials: {
    width: Matrics.s(32),
    height: Matrics.s(32),
    borderRadius: Matrics.s(100),
    backgroundColor: colors.GRAY_MEDIUM,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Matrics.s(10),
  },
  personInitialsText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: "700",
    color: colors.TEXT_PRIMARY,
  },
  personName: {
    flex: 1,
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
  },
  checkbox: {
    width: Matrics.s(18),
    height: Matrics.s(18),
    borderRadius: Matrics.s(7),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.PRIMARY,
    borderColor: colors.PRIMARY,
  },
  checkIcon: {
    width: Matrics.s(9),
    height: Matrics.s(9),
    tintColor: colors.WHITE,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  doneButton: {
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(30),
    paddingVertical: Matrics.vs(15),
    alignItems: "center",
    justifyContent: "center",
    marginTop: Matrics.vs(15),
  },
  doneButtonText: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.WHITE,
    lineHeight: Matrics.vs(16),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noPeopleText: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    lineHeight: Matrics.vs(16),
  }
});

export default AddPeopleModal;
