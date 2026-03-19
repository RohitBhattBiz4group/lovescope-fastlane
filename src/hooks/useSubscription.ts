import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SubscriptionService, { CurrentSubscriptionResponse } from "../services/subscriptionService";
import { retrieveData, StorageKeys, storeData } from "../storage";

type State = {
  data?: CurrentSubscriptionResponse;
  loading: boolean;
  refreshing: boolean;
  error?: unknown;
};

export type UseSubscriptionResult = State & {
  refresh: () => Promise<void>;
  setLocal: (data: CurrentSubscriptionResponse) => Promise<void>;
  planCode?: CurrentSubscriptionResponse["plan_code"];
  status?: CurrentSubscriptionResponse["status"];
  entitlements?: CurrentSubscriptionResponse["entitlements"];
};

const CACHE_KEY = StorageKeys.subscriptionSnapshot;

const useSubscription = (): UseSubscriptionResult => {
  const mountedRef = useRef(true);

  const [state, setState] = useState<State>({
    loading: true,
    refreshing: false,
  });

  const setLocal = useCallback(async (data: CurrentSubscriptionResponse) => {
    await storeData(CACHE_KEY, data);
    if (mountedRef.current) {
      setState((s) => ({ ...s, data }));
    }
  }, []);

  const loadCached = useCallback(async () => {
    const cached = await retrieveData(CACHE_KEY);
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached) as CurrentSubscriptionResponse;
      if (mountedRef.current) {
        setState((s) => ({ ...s, data: parsed, loading: false }));
      }
    } catch {
      return;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (mountedRef.current) {
      setState((s) => ({ ...s, refreshing: true, error: undefined }));
    }
    try {
      const current = await SubscriptionService.getCurrentSubscription();
      await setLocal(current);
    } catch (error) {
      if (mountedRef.current) {
        setState((s) => ({ ...s, error }));
      }
    } finally {
      if (mountedRef.current) {
        setState((s) => ({ ...s, loading: false, refreshing: false }));
      }
    }
  }, [setLocal]);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      await loadCached();
      await refresh();
    })();
    return () => {
      mountedRef.current = false;
    };
  }, [loadCached, refresh]);

  const planCode = useMemo(() => state.data?.plan_code, [state.data]);
  const status = useMemo(() => state.data?.status, [state.data]);
  const entitlements = useMemo(() => state.data?.entitlements, [state.data]);

  return {
    ...state,
    refresh,
    setLocal,
    planCode,
    status,
    entitlements,
  };
};

export default useSubscription;
