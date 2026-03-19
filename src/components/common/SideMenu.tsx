import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  FlatList,
  Easing,
  Keyboard,
} from "react-native";
import { BlurView } from "@react-native-community/blur";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import { IConversationHistory } from "../../interfaces/chatInterfaces";
import ConversationHistorySkeleton from "../../skeletons/ConversationHistorySkeleton";
import useTranslation from "../../hooks/useTranslation";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MENU_WIDTH = SCREEN_WIDTH * 0.82;

interface ConversationItem {
  id: string;
  title: string;
}

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  onNewChat?: () => void;
  onConversationPress?: (item: ConversationItem) => void;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  conversationHistory?: IConversationHistory[];
  onLoadMoreConversations?: () => void;
  conversationLoading?: boolean;
}

const SideMenu: React.FC<SideMenuProps> = ({
  visible,
  onClose,
  onNewChat,
  onConversationPress,
  searchValue = "",
  onSearchChange,
  conversationHistory,
  onLoadMoreConversations,
  conversationLoading,
}) => {
  const { t } = useTranslation();
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (visible) {
      // Mount the component
      setShouldRender(true);
      
      // Reset to starting position before animating in
      slideAnim.setValue(-MENU_WIDTH);
      fadeAnim.setValue(0);

      // Animate: Left to Right (open)
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate: Right to Left (close)
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -MENU_WIDTH,
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Unmount the component after animation completes
        setShouldRender(false);
      });
    }
  }, [visible, slideAnim, fadeAnim]);

  const renderConversationItem = ({ item }: { item: ConversationItem }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => {
        Keyboard.dismiss();
        onConversationPress?.(item);
      }}
      activeOpacity={0.7}
    >
      <Image
        source={Images.HISTORY_MENU_ICON}
        style={styles.chatIcon}
        resizeMode="contain"
      />
      <Text style={styles.conversationTitle} numberOfLines={1}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  if (!shouldRender) return null;

  return (
    <View style={styles.overlay}>
      {/* Blur background */}
      <Animated.View
        style={[styles.backdrop, { opacity: fadeAnim }]}
        pointerEvents="none"
      >
        <BlurView
          style={styles.blurView}
          blurType="light"
          blurAmount={20}
          reducedTransparencyFallbackColor="white"
        />
      </Animated.View>

      {/* Touchable overlay to close menu when clicking outside */}
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          onClose();
        }}
      >
        <View style={styles.touchableBackdrop} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        {/* Header */}
        <View style={styles.searchContainer}>
          <Text style={styles.historyTitle}>{t("common.conversation_history")}</Text>
          <TouchableOpacity style={styles.addButton} onPress={onNewChat}>
            <Image
              source={Images.ADD_CHAT_ICON}
              style={styles.addIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Conversation List */}
        {conversationLoading &&
        (!conversationHistory || conversationHistory.length === 0) ? (
          <ConversationHistorySkeleton />
        ) : (
          <FlatList
            data={conversationHistory}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            onEndReachedThreshold={0.2}
            onEndReached={onLoadMoreConversations}
            ListFooterComponent={
              conversationLoading &&
              conversationHistory &&
              conversationHistory.length > 0 ? (
                <ConversationHistorySkeleton />
              ) : null
            }
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
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
  touchableBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: colors.WHITE,
    paddingTop: Matrics.vs(25),
    shadowColor: "rgba(0, 0, 0, 0.09)",
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Matrics.s(16),
    marginBottom: Matrics.vs(10),
    gap: Matrics.s(10),
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 26, 26, 0.08)",
    borderRadius: Matrics.s(10),
    paddingHorizontal: Matrics.s(12),
    paddingVertical: Matrics.vs(8),
    minHeight: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.TEXT_DARK,
    padding: 0,
  },
  searchButton: {
    padding: Matrics.s(2),
  },
  searchIcon: {
    width: Matrics.s(20),
    height: Matrics.vs(20),
    tintColor: colors.GRAY_DARK,
  },
  addButton: {
    width: Matrics.s(30),
    height: Matrics.s(30),
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: {
    width: "100%",
    height: "100%",
  },
  historyTitle: {
    fontSize: Matrics.ms(16),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
    // paddingHorizontal: Matrics.s(16),
    // marginBottom: Matrics.vs(8),
  },
  listContainer: {
    paddingHorizontal: Matrics.s(16),
    paddingBottom: Matrics.vs(20),
  },
  loaderContainer: {
    paddingVertical: Matrics.vs(16),
    alignItems: "center",
    justifyContent: "center",
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Matrics.vs(8),
    gap: Matrics.s(12),
  },
  chatIcon: {
    width: Matrics.s(20),
    height: Matrics.s(20),
    tintColor: colors.TEXT_DARK,
  },
  conversationTitle: {
    flex: 1,
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
  },
});

export default SideMenu;
