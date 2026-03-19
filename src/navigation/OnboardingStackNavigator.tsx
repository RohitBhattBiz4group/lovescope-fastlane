import { createNativeStackNavigator } from "@react-navigation/native-stack";
import routes from "../constants/routes";
import Questions from "../screens/onboarding/Questions";
import Onboarding from "../screens/onboarding/Onboarding";
import OnboardingComplete from "../screens/onboarding/OnboardingComplete";

const OnboardingStack = createNativeStackNavigator();

const OnboardingStackNavigator: React.FC = () => {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen
        name={routes.onboarding.ONBOARDING} // "Onboarding"
        component={Onboarding}
      />
      <OnboardingStack.Screen
        name={routes.onboarding.QUESTION_ANSWER}
        component={Questions}
      />
      <OnboardingStack.Screen
        name={routes.onboarding.ONBOARDING_COMPLETE}
        component={OnboardingComplete}
      />
    </OnboardingStack.Navigator>
  );
};

export default OnboardingStackNavigator;
