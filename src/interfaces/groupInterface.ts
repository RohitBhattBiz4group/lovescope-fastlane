export interface ICreateGroup{
    group_name : string
    group_icon_url : string
    members : number[]
}

export interface IUpdateGroup{
    group_name? : string
    group_icon_url? : string
}

export interface IAddGroupMember{
    group_id : number
    group_icon_url?: string
    members : number[]
}

export interface IRemoveGroupMember{
    group_id : number
    user_id : number
}

export interface IGroupResponse{
    id : number
    user_id : number
    group_name : string
    group_icon_url? : string | null
    created_at : string
    unread_quiz_count: number
}

export interface IGroupMemberResponse{
    id : number
    group_id : number
    user_id : number
    full_name : string
    member_role : string
    image? : string | null
}

export interface IGroupDetailsResponse {
    group?: IGroupResponse
    members: IGroupMemberResponse[]
}

export interface IFriendResponse{
    id : number
    friend_id : number
    full_name : string
    image? : string | null
}

export interface IGroupMember {
    user_id: number
    full_name: string
    image?: string | null
}