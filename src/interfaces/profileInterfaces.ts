import { IApiResponseCommonInterface } from "./authInterfaces";

export interface ICreateProfile {
  full_name: string;
  age: number;
  gender: string;
  relationship_tag: string;
  ethnicity: string[];
  region: string;
  notes: string;
}

export interface ILoveProfile {
  id: number;
  user_id: number;
  full_name: string;
  age: number;
  gender: string;
  relationship_tag: string;
  ethnicity: string[];
  region: string;
  notes: string;
  created_ts: string;
  updated_ts: string;
}

export interface IProfileResponse extends IApiResponseCommonInterface<ILoveProfile> {}
export interface IProfilesListResponse extends IApiResponseCommonInterface<ILoveProfile[]> {}

