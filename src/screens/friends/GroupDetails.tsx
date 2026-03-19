import React, { useState, useRef, useMemo, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	FlatList,
	Animated,
} from "react-native";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import CommonHeader from "../../components/common/CommonHeader";
import AddPeopleModal from "../../components/friends/AddPeopleModal";
import EditGroupModal from "../../components/friends/EditGroupModal";
import { IGroupDetailsResponse, IGroupMemberResponse } from "../../interfaces/groupInterface";
import { UserStackParamList, GroupDetailsRouteProp } from "../../interfaces/navigationTypes";
import { toastMessageError, toastMessageSuccess } from "../../components/common/ToastMessage";
import groupService from "../../services/groupService";
import useTranslation from "../../hooks/useTranslation";
import useAuth from "../../hooks/useAuth";
import ConfirmationModal from "../../components/model/ConfirmationModal";
import { CDN_IMAGE_URL, GROUP_ROLE_ADMIN } from "../../constants/commonConstant";
import { getInitials, truncateText } from "../../utils/helper";
import LinearGradient from "react-native-linear-gradient";
import FullPageLoader from "../../components/common/FullPageLoader";


const GroupDetails: React.FC<ScreenProps<UserStackParamList, "GroupDetails">> = ({ navigation, route }) => {
	const { group } = (route as GroupDetailsRouteProp).params;
	const { t } = useTranslation();
	const { authData } = useAuth();
	const user = authData?.user;

	const [showHeaderTitle, setShowHeaderTitle] = useState(false);
	const [isAddPeopleModalVisible, setIsAddPeopleModalVisible] = useState(false);
	const [isEditGroupModalVisible, setIsEditGroupModalVisible] = useState(false);
	const [showLeaveGroupModel, setLeaveGroupModel] = useState(false);
	const [showRemoveMemberModel, setRemoveMemberModel] = useState(false);
	const [memberId, setMemberId] = useState<number>(0)
	const [isLeaving, setIsLeaving] = useState(false);
	const [isRemoving, setIsRemoving] = useState(false)
	const [loading, setLoading] = useState(true);
	const [peopleLoading, setPeopleLoading] = useState(false)
	const [peopleList, setPeopleList] = useState([])
	const [groupDetails, setGroupDetails] = useState(group)
	const [memberList, setMemberList] = useState<IGroupMemberResponse[] | null>([])
	const [isDeleting, setIsDeleting] = useState(false)
	const [showDeleteGroupModel, setShowDeleteGroupModel] = useState(false)
	const scrollY = useRef(new Animated.Value(0)).current;
	const SCROLL_THRESHOLD = useRef(160).current; // Show title after scrolling 160px

	useEffect(() => {
		fetchGroupDetails();
	}, [])

	const fetchGroupDetails = async () => {
		setLoading(true);
		try {
			const detailResponse = await groupService.getGroupDetails(group.id);
			console.log("Group Details Response:", detailResponse);
			if (detailResponse.success) {
				const data = detailResponse.data as IGroupDetailsResponse | undefined;
				// Sort members: admins first, then regular members
				const members = data?.members ?? [];
				const sortedMembers = [...members].sort((a, b) => {
					const aIsAdmin = a.member_role === GROUP_ROLE_ADMIN;
					const bIsAdmin = b.member_role === GROUP_ROLE_ADMIN;
					if (aIsAdmin && !bIsAdmin) return -1;
					if (!aIsAdmin && bIsAdmin) return 1;
					return 0;
				});
				setMemberList(sortedMembers.length > 0 ? sortedMembers : null);
				if (data?.group) {
					setGroupDetails(data.group);
				}
			} else {
				toastMessageError(detailResponse.message);
			}
		} catch (error) {
			console.error(error)
			toastMessageError(t("common.something_went_wrong"), t("group.detail.please_try_again_later"))
		} finally {
			console.log("Loading set to false");
			setLoading(false)
		}
	}

	const handleChangeGroupNameAndIcon = () => {
		setIsEditGroupModalVisible(true);
	};

	const handleSaveGroupChanges = async () => {
		// console.log("Saving group changes:", newGroupName, newGroupAvatar);
		// Here you would typically call an API to update the group
		await fetchGroupDetails()
		setIsEditGroupModalVisible(false);
	};

	const handleRemoveMember = async () => {
		setIsRemoving(true);
		try {
			const removeResponse = await groupService.removeMember({
				group_id: group.id,
				user_id: memberId
			})

			if (!removeResponse.success) {
				toastMessageError(removeResponse.message)
				setRemoveMemberModel(false)
			} else {
				toastMessageSuccess(removeResponse.message)
				setRemoveMemberModel(false)
				fetchGroupDetails()
			}
		}catch (error){
			toastMessageError(t('common.something_went_wrong'))
		} finally {
			setIsRemoving(false)
		}
	};

	const handleAddPeople = async () => {
		setIsAddPeopleModalVisible(true);
		setPeopleLoading(true);
		try {
			const friendResposne = await groupService.friendsNoInGroup(group.id)

			if (!friendResposne.success) {
				toastMessageError(t('common.something_went_wrong'), friendResposne.message)
			} else {
				setPeopleList(friendResposne.data ?? [])
			}
		} catch (error) {
			toastMessageError(t('common.something_went_wrong'))
		} finally {
			setPeopleLoading(false)
		}
	};

	const handleAddPeopleConfirm = async () => {
		await fetchGroupDetails();
		setIsAddPeopleModalVisible(false)
	};

	const handleDeleteGroup = () => {
		setShowDeleteGroupModel(true);
	};

	const handleConfirmDeleteGroup = async () => {
		setIsDeleting(true);
		try {
			const deleteResponse = await groupService.deleteGroup(group.id);
			if (!deleteResponse.success) {
				toastMessageError(deleteResponse.message);
				return;
			}
			toastMessageSuccess(deleteResponse.message);
			setShowDeleteGroupModel(false);
			navigation.navigate("FriendsMain", { initialTab: "groups" });
		} catch (error) {
			toastMessageError(t("common.something_went_wrong"), t("group.detail.please_try_again_later"));
		} finally {
			setIsDeleting(false);
		}
	};

	const handleLeaveGroup = async () => {
		setIsLeaving(true);
		try {
			const leaveResponse = await groupService.leaveGroup(group.id);

			if (!leaveResponse.success) {
				toastMessageError(leaveResponse.message)
			} else {
				toastMessageSuccess(leaveResponse.message)
				navigation.navigate("FriendsMain", { initialTab: "groups" });
			}
		} catch (error) {
			toastMessageError(t('common.something_went_wrong'), t("group.detail.leave_group_error_message"))
		} finally {
			setIsLeaving(false)
		}
	}

	const handleScroll = useMemo(
		() =>
			Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
				useNativeDriver: false,
				listener: (event: { nativeEvent: { contentOffset: { y: number } } }) => {
					const offsetY = event.nativeEvent.contentOffset.y;
					setShowHeaderTitle(offsetY > SCROLL_THRESHOLD);
				},
			}),
		[scrollY]
	);

	const renderMemberItem = (member: IGroupMemberResponse, index: number) => (
		<View
			key={member.id}
			style={[
				styles.memberItem,
				(memberList && index === memberList.length - 1) && styles.noBorder,
			]}
		>
			{member.image ?
				<Image source={{ uri: CDN_IMAGE_URL+member.image }} style={styles.memberAvatar} />
				: <View style={styles.initialsContainer}>
					<Text style={styles.initialsText}>{getInitials(member.full_name)}</Text>
				</View>
			}
			{(member.user_id == user?.id) ? <Text style={styles.memberName}>{t("group.detail.you")}</Text> : <Text style={styles.memberName}>{member.full_name}</Text>}
			{(member.member_role == GROUP_ROLE_ADMIN) ? (
				<View style={styles.adminBadge}>
					<Text style={styles.adminBadgeText}>{t("group.detail.admin")}</Text>
				</View>
			) : (user?.id == group.user_id) ?
				(<TouchableOpacity
					onPress={() => { setMemberId(member.user_id), setRemoveMemberModel(true) }}
				>
					<Text style={styles.removeButton}>{t("group.detail.remove")}</Text>
				</TouchableOpacity>) : ''
			}
		</View>
	);

	const renderListHeader = () => (
		<View style={styles.headerContent}>
			{/* Group Avatar */}
			<View style={styles.avatarContainer}>
				{(groupDetails.group_icon_url) ? <Image
					source={{ uri: CDN_IMAGE_URL+groupDetails.group_icon_url }}
					style={styles.groupAvatar}
					resizeMode="cover"
				/> : <View style={styles.initialsContainer}>
					<Text style={styles.initialsText}>{getInitials(groupDetails.group_name)}</Text>
				</View>}
			</View>

			{/* Group Name */}
			<Text style={styles.groupName}>{groupDetails.group_name}</Text>

			{/* Change Group Name & Icon */}
			<TouchableOpacity
				style={styles.changeButton}
				onPress={handleChangeGroupNameAndIcon}
				activeOpacity={0.7}
			>
				<Image
					source={Images.PENCIL_EDIT}
					style={styles.pencilIcon}
					resizeMode="contain"
				/>
				<Text style={styles.changeButtonText}>{t("group.detail.change_group_name_icon")}</Text>
			</TouchableOpacity>

			{/* Dashed Separator */}
			<Image
				source={Images.DASH_BORDER}
				style={styles.dashedSeparator}
				resizeMode="contain"
			/>

			{/* All Members Section */}
			<Text style={styles.sectionTitle}>{t("group.detail.all_members")}</Text>
		</View>
	);

	const renderListFooter = () => (
		<View style={styles.footerContent}>
			{/* Dashed Separator */}
			<Image
				source={Images.DASH_BORDER}
				style={styles.dashedSeparator}
				resizeMode="contain"
			/>

			{(user?.id == group.user_id) ? (
				<View>
					<TouchableOpacity
						style={styles.actionButton}
						onPress={handleAddPeople}
						activeOpacity={0.7}
					>
						<Image
							source={Images.ADD_PEOPLE_ICON}
							style={styles.actionIcon}
							resizeMode="contain"
						/>
						<Text style={styles.actionButtonText}>{t("group.detail.add_people")}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.actionButton}
						onPress={handleDeleteGroup}
						activeOpacity={0.7}
					>
						<Image
							source={Images.TRASH_ICON}
							style={styles.actionIconDanger}
							resizeMode="contain"
						/>
						<Text style={styles.actionButtonTextDanger}>{t("group.detail.delete_group")}</Text>
					</TouchableOpacity>
				</View>)
				: <TouchableOpacity
					style={styles.actionButton}
					onPress={() => setLeaveGroupModel(true)}
					activeOpacity={0.7}
				>
					<Image
						source={Images.EXIT_ICON}
						style={styles.actionIconDanger}
						resizeMode="contain"
					/>
					<Text style={styles.actionButtonTextDanger}>{t("group.detail.leave_group")}</Text>
				</TouchableOpacity>
			}
		</View>
	);

	return (
		<View style={styles.container}>
			<LinearGradient
				colors={['rgba(255, 255, 255, 1)', 'rgba(226, 232, 252)']}
				locations={[0.1977, 1]}
				style={styles.gradient}
			/>
			{/* Add People Modal */}
			<AddPeopleModal
				isLoading={peopleLoading}
				visible={isAddPeopleModalVisible}
				onClose={() => setIsAddPeopleModalVisible(false)}
				availablePeople={peopleList}
				onAddPeople={handleAddPeopleConfirm}
				groupId={groupDetails.id}
			/>

			{/* Edit Group Modal */}
			<EditGroupModal
				visible={isEditGroupModalVisible}
				onClose={() => setIsEditGroupModalVisible(false)}
				groupName={groupDetails.group_name}
				groupAvatar={groupDetails.group_icon_url ?? undefined}
				onSave={handleSaveGroupChanges}
				groupId={groupDetails.id}
			/>

			{/* Header */}
			<CommonHeader
				showBackButton
				onBackPress={() => navigation.goBack()}
				title={showHeaderTitle ? truncateText(groupDetails.group_name || t("friends.groups")) : undefined}
			/>

			{!loading && <FlatList
				data={memberList}
				renderItem={({ item, index }) => renderMemberItem(item, index)}
				keyExtractor={(item, index) => `${item.id}-${index}`}
				ListHeaderComponent={renderListHeader}
				ListFooterComponent={renderListFooter}
				showsVerticalScrollIndicator={false}
				onScroll={handleScroll}
				scrollEventThrottle={16}
				style={styles.content}
				contentContainerStyle={styles.scrollContent}
			/>}

			{loading && (
				<View style={styles.loadingOverlay}>
					{/* <ActivityIndicator size="large" color={colors.PRIMARY} /> */}
					<FullPageLoader showAnimatedText={false}/>
				</View>
			)}

			<ConfirmationModal
				visible={showLeaveGroupModel}
				title={t("group.detail.leave_group")}
				message={t("group.detail.leave_group_message")}
				onYesPress={handleLeaveGroup}
				onNoPress={() => setLeaveGroupModel(false)}
				loading={isLeaving}
				disable={isLeaving}
			/>

			<ConfirmationModal
				visible={showRemoveMemberModel}
				title={t("group.detail.remove_member")}
				message={t("group.detail.remove_member_message")}
				onYesPress={handleRemoveMember}
				onNoPress={() => setRemoveMemberModel(false)}
				loading={isRemoving}
				disable={isRemoving}
			/>

			<ConfirmationModal
				visible={showDeleteGroupModel}
				title={t("group.detail.delete_group")}
				message={t("group.detail.delete_group_message")}
				onYesPress={handleConfirmDeleteGroup}
				onNoPress={() => setShowDeleteGroupModel(false)}
				loading={isDeleting}
				disable={isDeleting}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "transparent",
	},
	gradient: {
		position: "absolute",
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
	},
	content: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: Matrics.vs(40),
	},
	headerContent: {
		paddingHorizontal: Matrics.s(20),
	},
	footerContent: {
		paddingHorizontal: Matrics.s(20),
	},
	avatarContainer: {
		alignItems: "center",
		marginTop: Matrics.vs(15),
	},
	groupAvatar: {
		width: Matrics.s(82),
		height: Matrics.s(82),
		borderRadius: Matrics.s(100),
		borderWidth: 1,
		borderColor: colors.GRAY_MEDIUM,
	},
	groupName: {
		fontSize: FontsSize.Large,
		fontFamily: typography.fontFamily.Poppins.SemiBold,
		fontWeight: "600",
		color: colors.TEXT_PRIMARY,
		textAlign: "center",
		marginTop: Matrics.vs(6),
	},
	changeButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginTop: Matrics.vs(2),
	},
	pencilIcon: {
		width: Matrics.s(20),
		height: Matrics.vs(20),
		tintColor: colors.PRIMARY,
		marginRight: Matrics.s(6),
	},
	changeButtonText: {
		fontSize: FontsSize.Medium,
		fontFamily: typography.fontFamily.Poppins.Medium,
		fontWeight: "500",
		color: colors.PRIMARY,
		lineHeight: Matrics.vs(20),
	},
	dashedSeparator: {
		width: "100%",
		height: Matrics.vs(1),
		marginTop: Matrics.vs(24),
		marginBottom: Matrics.vs(20),
	},
	sectionTitle: {
		fontSize: FontsSize.Regular,
		fontFamily: typography.fontFamily.Poppins.Medium,
		fontWeight: "500",
		color: colors.TEXT_PRIMARY,
		marginBottom: Matrics.vs(0),
	},
	memberItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: Matrics.vs(12),
		paddingHorizontal: Matrics.s(20),
		borderBottomWidth: 1,
		borderBottomColor: "rgba(0, 0, 0, 0.05)",
	},
	memberAvatar: {
		width: Matrics.s(40),
		height: Matrics.s(40),
		borderRadius: Matrics.s(100),
		marginRight: Matrics.s(15),
	},
	memberName: {
		flex: 1,
		fontSize: FontsSize.Medium,
		fontFamily: typography.fontFamily.Poppins.SemiBold,
		fontWeight: "600",
		color: colors.TEXT_PRIMARY,
	},
	adminBadge: {
		backgroundColor: colors.PRIMARY,
		borderRadius: Matrics.s(20),
		paddingHorizontal: Matrics.s(12),
		paddingVertical: Matrics.vs(6),
	},
	adminBadgeText: {
		fontSize: FontsSize.Small,
		fontFamily: typography.fontFamily.Poppins.Medium,
		fontWeight: "500",
		color: colors.WHITE,
		lineHeight: 16,
	},
	removeButton: {
		fontSize: FontsSize.Medium,
		fontFamily: typography.fontFamily.Poppins.Medium,
		fontWeight: "500",
		color: colors.DANGER,
	},
	actionButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: Matrics.vs(6),
	},
	actionIcon: {
		width: Matrics.s(20),
		height: Matrics.vs(20),
		tintColor: colors.PRIMARY,
		marginRight: Matrics.s(10),
	},
	actionIconDanger: {
		width: Matrics.s(20),
		height: Matrics.vs(20),
		tintColor: colors.DANGER,
		marginRight: Matrics.s(10),
	},
	actionButtonText: {
		fontSize: FontsSize.Medium,
		fontFamily: typography.fontFamily.Poppins.Medium,
		fontWeight: "500",
		color: colors.PRIMARY,
	},
	actionButtonTextDanger: {
		fontSize: FontsSize.Medium,
		fontFamily: typography.fontFamily.Poppins.Medium,
		fontWeight: "500",
		color: colors.DANGER,
	},
	noBorder: {
		borderBottomWidth: 0,
		paddingBottom: 0,
	},
	initialsContainer: {
		width: Matrics.s(40),
		height: Matrics.s(40),
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
	loadingOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: "center",
		alignItems: "center",
	},
});

export default GroupDetails;
