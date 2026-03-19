import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getAvailablePurchases,
  type Product,
  ProductAndroid,
} from 'react-native-iap';
import { APP } from '../constants/commonConstant';
import subscriptionService from '../services/subscriptionService';
import { CommonActions, useNavigation } from '@react-navigation/native';
import routes from "../constants/routes";
import { toastMessageError } from '../components/common/ToastMessage';

export const useSubscriptionIAP = (productIds: string[]) => {
  const navigation = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const fetchInFlightRef = useRef(false);
  const processedTransactionIdsRef = useRef<Set<string>>(new Set());
  const navigatedAfterPurchaseRef = useRef(false);

  const productIdsKey = useMemo(() => (productIds || []).join(','), [productIds]);

  const getAnyProductId = useCallback((p: any): string | undefined => {
    return p?.productId ?? p?.sku ?? p?.id;
  }, []);

  useEffect(() => {
    let updateSub: any;
    let errorSub: any;

    const init = async () => {
      try {
        await initConnection();
        setConnected(true);

        // ✅ Purchase success listener
        updateSub = purchaseUpdatedListener(
          async (purchase: any) => {
            const transactionId = Platform.OS === APP.IOS ? purchase?.originalTransactionIdentifierIOS : purchase?.transactionId;
            if (transactionId && processedTransactionIdsRef.current.has(transactionId)) {
              return;
            }

            try {
              let shouldNavigate = false;
              if (transactionId && purchase.productId) {
                const data = {
                  productId: purchase.productId,
                  transactionId: transactionId,
                }
                const response = await subscriptionService.createUserSubscription(data);
                shouldNavigate = !!(response && response.success);
              }

              await finishTransaction({ purchase });
              console.log('IAP finishTransaction success (acknowledged)', transactionId);

              if (transactionId) {
                processedTransactionIdsRef.current.add(transactionId);
              }

              if (shouldNavigate && !navigatedAfterPurchaseRef.current) {
                navigatedAfterPurchaseRef.current = true;
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [
                      {
                        name: 'MainStack',
                        state: {
                          index: 0,
                          routes: [
                            {
                              name: 'ProfilesTab',
                              state: {
                                index: 0,
                                routes: [{ name: routes.user.PARTNER_PROFILES }],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  })
                );
              }
            } catch (error) {
              console.log('IAP finishTransaction error', error);
            } finally {
              setLoading(false);
            }
          }
        );

        // ❌ Purchase error listener
        errorSub = purchaseErrorListener(err => {
          setLoading(false);
        });
      } catch (error) {
        setLoading(false);
        toastMessageError((error as Error)?.message);
      }
    };

    init();

    return () => {
      updateSub?.remove();
      errorSub?.remove();
      setConnected(false);
      endConnection();
    };
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!connected) return;
      if (!productIds || productIds.length === 0) {
        return;
      }
      if (fetchInFlightRef.current) return;

      fetchInFlightRef.current = true;
      try {
        // ✅ Fetch subscription products
        const result = await fetchProducts({ skus: productIds, type: 'subs' });
        setProducts(result as Product[]);
      } catch (error) {
        console.log('IAP fetchProducts error', error);
        toastMessageError((error as Error)?.message);
      } finally {
        fetchInFlightRef.current = false;
      }
    };

    run();
  }, [connected, productIdsKey]);

  /**
   * 🔥 Opens Google Play / Apple subscription popup
   */
  const buySubscription = useCallback(async (productId: string) => {
    try {
      setLoading(true);
      if (!connected) {
        console.log('IAP buySubscription error: Billing client not ready');
        return;
      }

      const matchedProduct = (products || []).find(p => getAnyProductId(p) === productId);

      const androidOfferToken =
        Platform.OS === APP.ANDROID
          ? (matchedProduct as ProductAndroid)?.subscriptionOfferDetailsAndroid?.[0]?.offerToken ??
          (matchedProduct as any)?.subscriptionOfferDetails?.[0]?.offerToken
          : undefined;

      if (Platform.OS === APP.ANDROID && !androidOfferToken) {
        console.log('IAP buySubscription error: No subscription offerToken found for this product');
        return;
      }

      const result = await requestPurchase({
        request: {
          ...(Platform.OS === APP.ANDROID
            ? {
              google: {
                skus: [productId],
                subscriptionOffers: [
                  {
                    sku: productId,
                    offerToken: androidOfferToken,
                  },
                ],
              },
            }
            : {
              ios: {
                sku: productId,
              },
            }),
        },
        type: 'subs',
      });
      void result;
    } catch (error) {
      console.log('IAP buySubscription error', error);
      setLoading(false);
    }
  }, [connected, products]);

  /**
   * ♻ Restore previous purchases
   */
  const restoreSubscriptions = async () => {
    try {
      const purchases = await getAvailablePurchases();
      console.log('Restored purchases:', purchases);
    } catch (error) {
      console.log('IAP restoreSubscriptions error', error);
    }
  };

  return {
    products,
    buySubscription,
    restoreSubscriptions,
    loading
  };
};
