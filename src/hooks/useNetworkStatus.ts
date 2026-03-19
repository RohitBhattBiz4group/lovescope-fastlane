import { useEffect, useState } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

/**
 * Custom hook to monitor network connectivity status in real-time
 * @returns Object containing isConnected boolean and network state details
 */
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    // Initial check
    const checkInitialState = async () => {
      const state = await NetInfo.fetch();
      setIsConnected(state.isConnected ?? false);
      setNetworkState(state);
    };

    checkInitialState();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
      setNetworkState(state);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isConnected,
    networkState,
  };
};

export default useNetworkStatus;

