import endpoints from "../constants/endpoints";
import { IApiResponseCommonInterface } from "../interfaces/authInterfaces";
import { IChangePassword, IUpdateProfile, IUpdateUserProfile } from "../interfaces/userProfile";
import { http } from "../utils/http";


/**
 * Service class for handling user profile related API operations.
 * Provides methods for managing user profile data and password changes.
 */
class userProfileService {
    /**
     * Changes the user's password.
     * @param data - The password change payload containing old and new password.
     * @returns A promise resolving to the API response.
     */
    changePassword = async (data: IChangePassword): Promise<IApiResponseCommonInterface<null>> => {
        return http.post(endpoints.user_profile.CHANGE_PASSWORD, data);
    };

    /**
     * Fetches the current user's profile information.
     * @returns A promise resolving to the API response with profile data.
     */
    profile = async (): Promise<IApiResponseCommonInterface<null>> => {
        return http.get(endpoints.user_profile.PROFILE);
    };

    /**
     * Updates the user's profile information.
     * @param data - The profile data to update.
     * @returns A promise resolving to the API response.
     */
    updateProfile = async (data: IUpdateProfile): Promise<IApiResponseCommonInterface<null>> =>{
        return http.post(endpoints.user_profile.PROFILE, data)
    }

    /**
     * Updates the user's profile fields (name, email, phone).
     * @param data - The profile fields to update.
     * @returns A promise resolving to the API response.
     */
    updateUserProfile = async (
      data: IUpdateUserProfile
    ): Promise<IApiResponseCommonInterface<null>> => {
      return http.put(
        endpoints.user_profile.UPDATE_USER_PROFILE,
        data
      );
    };

    /**
     * Deletes the user's account.
     * @returns A promise resolving to the API response.
     */
    deleteAccount = async (): Promise<IApiResponseCommonInterface<null>> => {
        return http.delete(endpoints.user_profile.DELETE_ACCOUNT);
    }
}

export default new userProfileService();