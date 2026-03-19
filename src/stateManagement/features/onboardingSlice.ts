import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ICreateProfile } from "../../interfaces/profileInterfaces";

interface OnboardingState {
  first_profile: Partial<ICreateProfile> | null;
}

const initialState: OnboardingState = {
  first_profile: null,
};

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    setFirstProfileField: (
      state,
      action: PayloadAction<{ field: keyof ICreateProfile; value: string | string[] | number }>
    ) => {
      if (!state.first_profile) {
        state.first_profile = {};
      }
      const { field, value } = action.payload;
      (state.first_profile as Record<string, string | string[] | number>)[field] = value;
    },
    setFirstProfile: (state, action: PayloadAction<Partial<ICreateProfile>>) => {
      state.first_profile = action.payload;
    },
    clearFirstProfile: (state) => {
      state.first_profile = null;
    },
  },
});

export const { setFirstProfileField, setFirstProfile, clearFirstProfile } =
  onboardingSlice.actions;

export default onboardingSlice.reducer;
