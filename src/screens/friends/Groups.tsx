import React, { useCallback, useState } from "react";
import {
  FlatList,
  Text,
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import goupService from "../../services/groupService";
import { IGroupResponse } from "../../interfaces/groupInterface";
import { toastMessageError } from "../../components/common/ToastMessage";
import {
  colors,
  FontsSize,
  Matrics,
  typography,
} from "../../config/appStyling";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { UserNavigationProp } from "../../interfaces/navigationTypes";
import useTranslation from "../../hooks/useTranslation";
import Images from "../../config/Images";
import EmptyData from "../../components/common/EmptyData";
import { getInitials } from "../../utils/helper";
import { CDN_IMAGE_URL, LIMIT_QUIZ } from "../../constants/commonConstant";
import FullPageLoader from "../../components/common/FullPageLoader";

interface GroupsProps {
  refreshToken?: number;
}

const Groups: React.FC<GroupsProps> = ({ refreshToken }) => {
  const navigation = useNavigation<UserNavigationProp>();
  const { t } = useTranslation();
  const [groupList, setGroupList] = useState<IGroupResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchGroupList = useCallback(
    async (pageNum: number = 1, refresh: boolean = false) => {
      try {
        if (refresh) {
          setPage(1);
        } else if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const res = await goupService.getGroupList(pageNum, LIMIT_QUIZ);
        if (res.success && res.data) {
          const newData = res.data;
          if (refresh || pageNum === 1) {
            setGroupList(newData);
          } else {
            setGroupList((prev) => {
              const existingIds = new Set(prev.map((group) => group.id));
              const uniqueNewData = newData.filter(
                (group) => !existingIds.has(group.id),
              );
              return [...prev, ...uniqueNewData];
            });
          }

          setHasMore(res.has_more ?? false);
          setPage(pageNum);
        } else {
          toastMessageError(res.message);
        }
      } catch (error) {
        console.error(error);
        toastMessageError(
          t("common.something_went_wrong"),
          t("group.detail.please_try_again_later"),
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  // Load more groups
  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      fetchGroupList(page + 1);
    }
  }, [hasMore, loadingMore, loading, page, fetchGroupList]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchGroupList(1, true);
    }, [fetchGroupList, refreshToken]),
  );

  const renderGroupItem = ({
    item,
    index,
  }: {
    item: IGroupResponse;
    index: number;
  }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("GroupChat", { group: item })}
    >
      <View
        style={[
          styles.groupItem,
          groupList && index === groupList.length - 1 && styles.noBorder,
        ]}
      >
        {item.group_icon_url ? (
          <Image source={{ uri: CDN_IMAGE_URL+item.group_icon_url }} style={styles.avatar} />
        ) : (
          <View style={styles.initialsContainer}>
            <Text style={styles.initialsText}>
              {getInitials(item.group_name)}
            </Text>
          </View>
        )}
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.group_name}</Text>
          {/* <Text style={styles.groupMembers}>{item.group_members}</Text> */}
        </View>
        {!!item.unread_quiz_count && item.unread_quiz_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread_quiz_count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      {loading && groupList.length === 0 ? (
        <View style={styles.loadingContainer}>
          {/* <ActivityIndicator size="large" color={colors.PRIMARY} /> */}
          <FullPageLoader showAnimatedText={false}/>
        </View>
      ) : groupList.length > 0 ? (
        <FlatList
          data={groupList}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={colors.PRIMARY} />
              </View>
            ) : null
          }
        />
      ) : (
        <EmptyData
          icon={Images.GROUPS_ICON}
          title={t("group.no_groups_yet")}
          description={t("group.no_groups_description")}
          containerStyle={{ height: Matrics.screenHeight * 0.5 }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingTop: Matrics.vs(10),
    overflow: "visible",
  },
  avatar: {
    width: Matrics.s(44),
    height: Matrics.s(44),
    borderRadius: Matrics.s(100),
    marginRight: Matrics.s(15),
  },
  // Group styles
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Matrics.s(20),
    paddingVertical: Matrics.vs(12),
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
    overflow: "visible",
    zIndex: 1,
  },
  groupInfo: {
    flex: 1,
    marginLeft: Matrics.s(0),
  },
  groupName: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(2),
  },
  groupMembers: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "400",
    color: colors.TEXT_PRIMARY,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  initialsContainer: {
    width: Matrics.s(44),
    height: Matrics.s(44),
    borderRadius: Matrics.s(100),
    backgroundColor: colors.GRAY_MEDIUM,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Matrics.s(15),
  },
  initialsText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: "700",
    color: colors.TEXT_PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingMoreContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Matrics.vs(20),
  },
  loadingMoreText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_SECONDARY,
    opacity: 0.6,
  },
  unreadBadge: {
    width: Matrics.s(19),
    height: Matrics.s(19),
    borderRadius: Matrics.s(100),
    backgroundColor: colors.PRIMARY_LG,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: {
    fontSize: Matrics.ms(9),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "500",
    color: colors.WHITE,
    lineHeight: Matrics.vs(16),
  },
});

export default Groups;
