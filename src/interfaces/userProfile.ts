export interface IChangePassword {
    current_password: string;
    new_password: string;
}

export interface IUpdateProfile {
    url : string
}

export interface IUpdateUserProfile {
  name?: string;
  email?: string;
  phone_number?: string;
  country_code?: string;
  country_name?: string;
}
