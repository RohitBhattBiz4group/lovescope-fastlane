import { post, get, http } from "../utils/http";
import endpoints from "../constants/endpoints";
import { handleApiError } from "../utils/http";
import { IApiResponseCommonInterface } from "../interfaces/authInterfaces";

export interface FriendRequestResponse {
	id: number;
	sender_id: number;
	receiver_id: number;
	sender_name: string;
	receiver_name: string;
	sender_email: string;
	receiver_email: string;
	sender_image?: string;
	receiver_image?: string;
	status: "pending" | "approved" | "rejected";
	created_at: string;
}

export interface FriendResponse {
	id: number;
	friend_id: number;
	friend_name: string;
	friend_email: string;
	friend_image?: string;
	created_at: string;
	unread_quiz_count : number
}

export interface SendFriendRequestPayload {
	receiver_email: string;
}

export interface FriendRequestActionPayload {
	request_id: number;
}

export interface DeleteFriendPayload {
	friend_id: number;
}

export interface ApiResponse<T> {
	message: string;
	success: boolean;
	data?: T;
	error?: Record<string, string>;
	status_code: number;
	has_more?: boolean;
}

/**
 * Send a friend request to another user
 */
export const sendFriendRequest = async (
	payload: SendFriendRequestPayload
): Promise<ApiResponse<null>> => {
	try {
		const response = await post<SendFriendRequestPayload, never, ApiResponse<null>>(
			endpoints.friends.SEND_REQUEST,
			payload
		);
		return response;
	} catch (error) {
		return handleApiError(error) as ApiResponse<null>;
	}
};

/**
 * Approve a friend request
 */
export const approveFriendRequest = async (
	payload: FriendRequestActionPayload
): Promise<ApiResponse<null>> => {
	try {
		const response = await post<FriendRequestActionPayload, never, ApiResponse<null>>(
			endpoints.friends.APPROVE_REQUEST,
			payload
		);
		return response;
	} catch (error) {
		return handleApiError(error) as ApiResponse<null>;
	}
};

/**
 * Reject a friend request
 */
export const rejectFriendRequest = async (
	payload: FriendRequestActionPayload
): Promise<ApiResponse<null>> => {
	try {
		const response = await post<FriendRequestActionPayload, never, ApiResponse<null>>(
			endpoints.friends.REJECT_REQUEST,
			payload
		);
		return response;
	} catch (error) {
		return handleApiError(error) as ApiResponse<null>;
	}
};

/**
 * Get all friend requests (sent and received) with pagination
 * @param page - Page number (default: 1)
 * @param limit - Number of requests per page (default: 10)
 */
export const getFriendRequests = async (
	page: number = 1,
	limit: number = 10
): Promise<ApiResponse<FriendRequestResponse[]>> => {
	try {
		const response = await get<
			{ page: number; limit: number },
			ApiResponse<FriendRequestResponse[]>
		>(endpoints.friends.REQUESTS, {
			page,
			limit,
		});
		return response;
	} catch (error) {
		return handleApiError(error) as ApiResponse<FriendRequestResponse[]>;
	}
};

/**
 * Get friends list with pagination
 * @param page - Page number (default: 1)
 * @param limit - Number of friends per page (default: 10)
 */
export const getFriendsList = async (
	page: number = 1,
	limit: number = 10
): Promise<ApiResponse<FriendResponse[]>> => {
	try {
		const response = await get<
			{ page: number; limit: number },
			ApiResponse<FriendResponse[]>
		>(endpoints.friends.LIST, {
			page,
			limit,
		});
		return response;
	} catch (error) {
		return handleApiError(error) as ApiResponse<FriendResponse[]>;
	}
};

/**
 * Delete a friend
 */
export const deleteFriend = async (
	payload: DeleteFriendPayload
): Promise<ApiResponse<null>> => {
	try {
		const response = await post<DeleteFriendPayload, never, ApiResponse<null>>(
			endpoints.friends.DELETE,
			payload
		);
		return response;
	} catch (error) {
		return handleApiError(error) as ApiResponse<null>;
	}
};

/**
 * Get all friends (without pagination)
 */
export const getAllFriends = async (): Promise<ApiResponse<FriendResponse[]>> => {
	try {
		const response = await get<never, ApiResponse<FriendResponse[]>>(
			endpoints.friends.ALL
		);
		return response;
	} catch (error) {
		return handleApiError(error) as ApiResponse<FriendResponse[]>;
	}
};

/**
 * Updates the user's profile information.
 * @param data - The profile data to update.
 * @returns A promise resolving to the API response.
*/
export const sendInvite = async (data: { phoneNumber: string; countryCode: string }): Promise<IApiResponseCommonInterface<null>> =>{
        const payload = {
                phoneNumber: data.phoneNumber,
                countryCode: data.countryCode,
        };

        return http.post(endpoints.friends.SEND_INVITE, payload)
}

/**
 * Adds a friend request entry for the user to whom the invite was sent.
 */
export const updateFriendRequest = async (data: {phoneNumber: string}): Promise<IApiResponseCommonInterface<null>> =>{
        return http.post(endpoints.friends.UPDATE_REQUEST, data)
}