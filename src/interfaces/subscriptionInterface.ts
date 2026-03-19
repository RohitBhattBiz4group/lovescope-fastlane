export interface ISubscriptionPlan {
  id: number;
  plan_name: string;
  currency: string;
  price: number;
  features: string[] | Record<string, string>;
  billing_cycle: string;
}

export interface IUserSubscription {
  productId: string;
  transactionId: string;
}

export interface IUserSubscriptionResponse {
  id: number;
  product_id: string;
  subscription_id: string;
  status: string;
  start_date: string;
  end_date: string;
  limits: {
    analyzer_limit: string;
    limit: string;
    quiz_limit: string;
    text_limit: string;
  }
}