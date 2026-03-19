import * as http from "../utils/http";
import endpoints from "../constants/endpoints";
import { ICreateProfile, IProfileResponse, IProfilesListResponse } from "../interfaces/profileInterfaces";

class ProfileService {
  createProfile = async (
    data: ICreateProfile
  ): Promise<IProfileResponse> => {
    console.log(data);
    return http.post(endpoints.profiles.CREATE, data);
  };

  getProfiles = async (): Promise<IProfilesListResponse> => {
    return http.get(endpoints.profiles.GET_ALL);
  };

  getProfileById = async (profileId: number): Promise<IProfileResponse> => {
    return http.get(`${endpoints.profiles.GET_BY_ID}/${profileId}`);
  };

  updateProfile = async (
    profileId: number,
    data: ICreateProfile
  ): Promise<IProfileResponse> => {
    return http.put(`${endpoints.profiles.UPDATE}/${profileId}`, data);
  };

  deleteProfile = async (profileId: number): Promise<IProfileResponse> => {
    return http.remove(`${endpoints.profiles.DELETE}/${profileId}`);
  };
}

export default new ProfileService();

