import { useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppDispatch } from "../../stateManagement/hooks";
import { initializeAuth } from "../../stateManagement/features/authSlice";
import { removeData, StorageKeys } from "../../storage";
import { APP } from "../../constants/commonConstant";
 
/**
 * Component that initializes authentication state from storage on app start
 * This should be rendered once at the root of the app, inside the Redux Provider
 */
const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const dispatch = useAppDispatch();
 
    useEffect(() => {
        const init = async () => {
            if (Platform.OS === APP.IOS) {
                const hasLaunched = await AsyncStorage.getItem("hasLaunched");
                if (!hasLaunched) {
                    await removeData(StorageKeys.authData);
                    await removeData(StorageKeys.onboardingQuestionId);
                    await AsyncStorage.setItem("hasLaunched", "true");
                }
            }
 
            dispatch(initializeAuth());
        };
 
        init();
    }, [dispatch]);
 
    return <>{children}</>;
};
 
export default AuthInitializer;