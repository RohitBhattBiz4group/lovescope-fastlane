import { get, patch } from "../utils/http";
import endpoints from "../constants/endpoints";
import { handleApiError } from "../utils/http";

export interface NotificationResponse {
	id: number;
	user_id: number;
	title: string;
	content: string;
	created_ts: string;
	updated_ts: string;
}

export interface UnreadCountResponse {
	unread_count: number;
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
 * Get notifications for the authenticated user with pagination
 * @param page - Page number (default: 1)
 * @param limit - Number of notifications per page (default: 10)
 */
export const getNotifications = async (
	page: number = 1,
	limit: number = 10
): Promise<ApiResponse<NotificationResponse[]>> => {
	try {
		const response = await get<
			{ page: number; limit: number },
			ApiResponse<NotificationResponse[]>
		>(endpoints.notifications.LIST, {
			page,
			limit,
		});
		return response;
	} catch (error) {
		return handleApiError(error) as ApiResponse<NotificationResponse[]>;
	}
};

/**
 * Mark all notifications as read for the authenticated user
 */
export const markAllNotificationsAsRead = async (): Promise<ApiResponse<null>> => {
	try {
		const response = await patch<null, null, ApiResponse<null>>(
			endpoints.notifications.MARK_ALL_AS_READ,
			null
		);
		return response.data;
	} catch (error) {
		return handleApiError(error) as ApiResponse<null>;
	}
};

/**
 * Get unread notification count for the authenticated user
 */
export const getUnreadNotificationCount = async (): Promise<ApiResponse<UnreadCountResponse>> => {
	try {
		const response = await get<null, ApiResponse<UnreadCountResponse>>(
			endpoints.notifications.UNREAD_COUNT
		);
		return response;
	} catch (error) {
		return handleApiError(error) as ApiResponse<UnreadCountResponse>;
	}
};
