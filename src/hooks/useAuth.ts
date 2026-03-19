import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../stateManagement/hooks";
import { signOutThunk, setAuthDataThunk, clearError } from "../stateManagement/features/authSlice";
import { IAuthData } from "../interfaces/commonInterfaces";

/**
 * Custom hook to access and manage authentication state via Redux
 * This replaces the previous Context-based implementation
 */
const useAuth = () => {
  const dispatch = useAppDispatch();
  const authData = useAppSelector((state) => state.authData.authData);
  const loading = useAppSelector((state) => state.authData.loading);
  const appLoading = useAppSelector((state) => state.authData.appLoading);
  const errorMessage = useAppSelector((state) => state.authData.errorMessage);

  const signOut = useCallback(async () => {
    await dispatch(signOutThunk()).unwrap();
  }, [dispatch]);

  const setAuthData = useCallback(
    (data: IAuthData | undefined) => {
      return dispatch(setAuthDataThunk(data)).unwrap();
    },
    [dispatch]
  );

  const clearErrorHandler = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    authData: authData || undefined,
    loading,
    appLoading,
    signOut,
    setAuthData,
    errorMessage,
    clearError: clearErrorHandler,
  };
};

export default useAuth;

