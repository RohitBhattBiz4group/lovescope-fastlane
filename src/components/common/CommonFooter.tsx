import React from "react";
import { View, TouchableOpacity, Image, StyleSheet, Platform } from "react-native";
import { CopilotStep } from "react-native-copilot";

import Images from "../../config/Images";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import { CopilotTouchableOpacity, CopilotView } from "../walkthrough";

interface CommonFooterProps {
  activeTab?: "chat" | "heart" | "file" | "user" | "settings";
  onChatPress?: () => void;
  onHeartPress?: () => void;
  onFilePress?: () => void;
  onUserPress?: () => void;
  onSettingsPress?: () => void;
  bgColor?: string;
  userTabTooltip?: {
    active: boolean;
    text: string;
    order: number;
    name: string;
  };
  filesTabTooltip?: {
    active: boolean;
    text: string;
    order: number;
    name: string;
  };
  chatTabTooltip?: {
    active: boolean;
    text: string;
    order: number;
    name: string;
  };
}

const CommonFooter: React.FC<CommonFooterProps> = ({
  activeTab,
  onChatPress,
  onHeartPress,
  onFilePress,
  onUserPress,
  onSettingsPress,
  bgColor,
  userTabTooltip,
  filesTabTooltip,
  chatTabTooltip,
}) => {
  const getIconStyle = (tab: string) => {
    return activeTab === tab ? styles.activeIcon : styles.icon;
  };

  return (
    <View style={[styles.container, bgColor && { backgroundColor: bgColor }]}>
      {chatTabTooltip?.active ? (
        <CopilotStep
          text={chatTabTooltip.text}
          order={chatTabTooltip.order}
          name={chatTabTooltip.name}
          active={chatTabTooltip.active}
        >
          <CopilotView collapsable={false} style={styles.chatTooltipWrapper}>
            <TouchableOpacity
              style={styles.tabButton}
              onPress={onChatPress}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Image
                source={Images.CHAT_MENU_ICON}
                style={getIconStyle("chat")}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </CopilotView>
        </CopilotStep>
      ) : (
        <TouchableOpacity style={styles.tabButton} onPress={onChatPress} hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}>
          <Image
            source={Images.CHAT_MENU_ICON}
            style={getIconStyle("chat")}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.tabButton} onPress={onHeartPress} hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}>
        <Image
          source={Images.HEART_MENU_ICON}
          style={getIconStyle("heart")}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Files Tab Walkthrough */}
      {filesTabTooltip?.active ? (
        <CopilotStep
          text={filesTabTooltip.text}
          order={filesTabTooltip.order}
          name={filesTabTooltip.name}
        >
          <CopilotView collapsable={false} style={styles.filesTooltipWrapper}>
            <TouchableOpacity
              style={styles.tabButton}
              onPress={onFilePress}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Image
                source={Images.FILE_MENU_ICON}
                style={getIconStyle("file")}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </CopilotView>
        </CopilotStep>
      ) : (
        <TouchableOpacity
          style={styles.tabButton}
          onPress={onFilePress}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Image
            source={Images.FILE_MENU_ICON}
            style={getIconStyle("file")}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}



      {
        userTabTooltip?.active ? (
          <CopilotStep
            text={userTabTooltip.text}
            order={userTabTooltip.order}
            name={userTabTooltip.name}
            active={userTabTooltip.active}
          >
            {/*  */}
            <CopilotTouchableOpacity style={styles.userTooltipWrapper}>
              <TouchableOpacity style={styles.tabButton} onPress={onUserPress} hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}>
                <Image
                  source={Images.USER_MENU_ICON}
                  style={getIconStyle("user")}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </CopilotTouchableOpacity>
          </CopilotStep>
        ) : (
          <TouchableOpacity onPress={onUserPress} hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }} style={styles.tabButton}>
            <Image
              source={Images.USER_MENU_ICON}
              style={getIconStyle("user")}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )
      }

      <TouchableOpacity style={styles.tabButton} onPress={onSettingsPress} hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}>
        <Image
          source={Images.SETTING_MENU_ICON}
          style={getIconStyle("settings")}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: Matrics.vs(15),
    paddingHorizontal: Matrics.s(0),
    paddingBottom: Platform.OS === "ios" ? Matrics.vs(25) : Matrics.vs(15),
    // paddingBottom: Matrics.s(15),
    borderTopWidth: 1,
    borderTopColor: "rgba(31, 31, 31, 0.10)",
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: Matrics.s(22),
    height: Matrics.vs(22),
    tintColor: colors.GRAY_DARK,
  },
  activeIcon: {
    width: Matrics.s(22),
    height: Matrics.vs(22),
    tintColor: colors.PRIMARY,
  },
  filesTooltipWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Matrics.s(16),
    paddingVertical: Matrics.vs(10),
  },
  chatTooltipWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Matrics.s(16),
    paddingVertical: Matrics.vs(10),
  },
  userTooltipWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Matrics.s(16),
    paddingVertical: Matrics.vs(10),
  },
});

export default CommonFooter;
