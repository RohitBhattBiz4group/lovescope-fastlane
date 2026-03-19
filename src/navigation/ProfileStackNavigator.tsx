import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PartnerProfiles from "../screens/profile/PartnerProfiles";
import ProfileChat from "../screens/profile/ProfileChat";
import AddNewProfile from "../screens/profile/AddNewProfile";
import RelationshipTimeline from "../screens/profile/RelationshipTimeline";
import Notifications from "../screens/notifications/Notifications";
import CommonHeader from "../components/common/CommonHeader";

const ProfilesStack = createNativeStackNavigator();

/**
 * Stack for the "heart" tab (profiles flow)
 */
const ProfilesStackNavigator: React.FC = () => {
  return (
    <ProfilesStack.Navigator
      initialRouteName="PartnerProfiles"
      screenOptions={{
        headerShown: false, // use your CommonHeader inside screens instead
        contentStyle: { backgroundColor: "transparent" },
        animation: "slide_from_right",
      }}
    >
      <ProfilesStack.Screen
        name="PartnerProfiles"
        component={PartnerProfiles}
      />
      <ProfilesStack.Screen name="ProfileChat" component={ProfileChat} />
      <ProfilesStack.Screen name="RelationshipTimeline" component={RelationshipTimeline} />
      <ProfilesStack.Screen name="AddNewProfile" component={AddNewProfile} />
      <ProfilesStack.Screen
        name="Notifications"
        component={Notifications}
        options={{
          headerShown: true,
          header: ({ navigation }) => (
            <CommonHeader
              title="Notifications"
              showBackButton={true}
              onBackPress={() => navigation.goBack()}
            />
          ),
        }}
      />
    </ProfilesStack.Navigator>
  );
};

export default ProfilesStackNavigator;
