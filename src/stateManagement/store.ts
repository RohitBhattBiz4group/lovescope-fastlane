import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./features/authSlice";
import onboardingSlice from "./features/onboardingSlice";

// This code exports the Redux store configured with reducers.
export const store = configureStore({
  // Reducers define how the state is updated in response to actions.
  reducer: {
    authData: authSlice,
    onboarding: onboardingSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Define types for the RootState and AppDispatch based on the store.
// RootState represents the type of the whole Redux state.
export type RootState = ReturnType<typeof store.getState>;

// AppDispatch represents the type of the dispatch function in the store.
export type AppDispatch = typeof store.dispatch;

export default store;

