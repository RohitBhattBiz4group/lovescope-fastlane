import EncryptedStorage from "react-native-encrypted-storage";

export enum StorageKeys {
  authData = "authData",
  onboardingQuestionId = "onboardingQuestionId",
  onboardingPageKey = "onboardingPageKey",
}

export const storeData = async (key: StorageKeys, value: any): Promise<void> => {
  try {
    await EncryptedStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error storing data:", error);
    throw error;
  }
};

export const retrieveData = async (key: StorageKeys): Promise<string | null> => {
  try {
    const value = await EncryptedStorage.getItem(key);
    return value;
  } catch (error) {
    console.error("Error retrieving data:", error);
    return null;
  }
};

export const removeData = async (key: StorageKeys): Promise<void> => {
  try {
    // Check if key exists before removing to avoid error
    const exists = await EncryptedStorage.getItem(key);
    if (exists) {
      await EncryptedStorage.removeItem(key);
    }
  } catch (error) {
    console.error("Error removing data:", error);
    throw error;
  }
};

