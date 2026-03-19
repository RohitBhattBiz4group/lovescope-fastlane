import endpoints from "../constants/endpoints";
import { IApiResponseCommonInterface } from "../interfaces/authInterfaces";
import { IAddGroupMember, ICreateGroup, IGroupDetailsResponse, IGroupMember, IGroupResponse, IRemoveGroupMember, IUpdateGroup } from "../interfaces/groupInterface";
import { http } from "../utils/http";
import { get } from "../utils/http";

interface PaginatedApiResponse<T> extends IApiResponseCommonInterface<T> {
    has_more?: boolean;
}

class goupService {

    // Fetches the current user's group list with pagination.
    // @param page - Page number (default: 1)
    // @param limit - Number of groups per page (default: 10)
    getGroupList = async (
        page: number = 1,
        limit: number = 10
    ): Promise<PaginatedApiResponse<IGroupResponse[]>> => {
        return get<{ page: number; limit: number }, PaginatedApiResponse<IGroupResponse[]>>(
            endpoints.group.LIST,
            { page, limit }
        );
    }


    // Fetches details for a specific group by ID.
    getGroupDetails =  async (groupId: number): Promise<IApiResponseCommonInterface<IGroupDetailsResponse>> => {
        return http.get(endpoints.group.GROUP_DETAIL.replace('{group_id}', groupId.toString()));
    }

    // Removes the current user from the specified group.
    leaveGroup = async (groupId: number) : Promise<IApiResponseCommonInterface<null>> => {
        return http.delete(endpoints.group.LEAVE_GROUP.replace('{group_id}', groupId.toString()))
    }

    // Deletes the specified group by ID.
    deleteGroup = async (groupId: number) : Promise<IApiResponseCommonInterface<null>> => {
        return http.delete(endpoints.group.DELETE.replace('{group_id}', groupId.toString()))
    }
    
    // Fetches friends who are not currently members of the specified group.
    friendsNoInGroup = async (groupId: number) : Promise<IApiResponseCommonInterface<null>> => {
        return http.get(endpoints.group.FETCH_FRIENDS_NOT_IN_GROUP.replace('{group_id}',groupId.toString()))
    }

    // Adds one or more friends to a group.
    addFriendsInGroup = async (data : IAddGroupMember) : Promise<IApiResponseCommonInterface<null>> => {
        return http.post(endpoints.group.ADD_MEMBER,data)
    }

    // Removes a member from a group.
    removeMember = async (data : IRemoveGroupMember) : Promise<IApiResponseCommonInterface<null>> => {
        return http.post(endpoints.group.REMOVE_MEMBER,data)
    }

    // Updates an existing group by ID (path param `{group_id}`) with the provided payload.
    updateGroup = async (data : IUpdateGroup,group_id:number) : Promise<IApiResponseCommonInterface<null>> => {
        return http.put(endpoints.group.UPDATE_GROUP.replace('{group_id}',group_id.toString()),data)
    }

    // Creates a new group.
    createGroup = async (data : ICreateGroup) : Promise<IApiResponseCommonInterface<null>> => {
        return http.post(endpoints.group.CREATE,data)
    }

    // Fetches all members of a specific group.
    getGroupMembers = async (groupId: number): Promise<IApiResponseCommonInterface<IGroupMember[]>> => {
        return http.get(endpoints.group.GET_GROUP_MEMBERS_LIST.replace('{group_id}', groupId.toString()))
    }
}

export default new goupService();