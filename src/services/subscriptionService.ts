import * as http from "../utils/http";
import endpoints from "../constants/endpoints";
import { ISubscriptionPlan, IUserSubscription, IUserSubscriptionResponse } from "../interfaces/subscriptionInterface";
import { IApiResponseCommonInterface } from "../interfaces/authInterfaces";


class SubscriptionService {
  
  getSubscriptionPlans = async (): Promise<IApiResponseCommonInterface<ISubscriptionPlan[]>> => {
    return http.get(`${endpoints.subscriptions.GET_PLANS}`);
  };
  
  createUserSubscription = async (data: IUserSubscription): Promise<IApiResponseCommonInterface<IUserSubscription>> => {
    return http.post(`${endpoints.subscriptions.CREATE_USER_SUBSCRIPTION}`, data);
  };

  getUserCurrentSubscription = async (): Promise<IApiResponseCommonInterface<IUserSubscriptionResponse>> => {
    return http.get(`${endpoints.subscriptions.GET_USER_SUBSCRIPTIONS}`);
  };
}

export default new SubscriptionService();
