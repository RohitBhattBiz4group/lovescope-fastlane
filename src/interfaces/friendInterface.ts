export interface AddFriendFormData {
  method: "email" | "phone";
  email: string;
  country_code: string;
  calling_code: string;
  phone: string;
}
