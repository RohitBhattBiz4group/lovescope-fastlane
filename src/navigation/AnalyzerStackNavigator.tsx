import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TextAnalysisResult from "../screens/analyzer/TextAnalysisResult";
import PartnerPortraitResult from "../screens/analyzer/PartnerPortraitResult";
import Analyzer from "../screens/analyzer/Analyzer";
import CommonHeader from "../components/common/CommonHeader";
import useTranslation from "../hooks/useTranslation";
import LineByLineAnalysis from "../screens/analyzer/LineByLineAnalysis";
import Notifications from "../screens/notifications/Notifications";
import TextAnalysis from "../screens/analyzer/TextAnalysis";
import PartnerPotrait from "../screens/analyzer/PartnerPotrait";
import ArgumentAnalysis from "../screens/analyzer/ArgumentAnalysis";
import ArgumentAnalysisResult from "../screens/analyzer/ArgumentAnalysisResult";
import RelationshipTimeline from "../screens/profile/RelationshipTimeline";
import Subscription from "../screens/subscription/Subscription";
const AnalyzerStack = createNativeStackNavigator();

const AnalyzerStackNavigator: React.FC = () => {
    const { t } = useTranslation();
    return (
        <AnalyzerStack.Navigator
            initialRouteName="Analyzer"
            screenOptions={{
                headerShown: true, // use your CommonHeader inside screens instead
                contentStyle: { backgroundColor: "transparent" },
                animation: "slide_from_right",
            }}
        >
            <AnalyzerStack.Screen name="Analyzer" component={Analyzer} options={{
                header: ({ navigation }) => (
                    <CommonHeader
                        title={t("analyzer.title")}
                        showNotificationBadge={true}
                        onNotificationPress={() => navigation.navigate("Notifications")}
                    />
                ),
            }} />
            <AnalyzerStack.Screen name="TextAnalysis" component={TextAnalysis} 
            options={{
                header: ({ navigation }) => (
                    <CommonHeader
                        title={t("analyzer.text_analysis")}
                        showBackButton={true}
                        onBackPress={() => navigation.goBack()}
                        showNotificationBadge={true}
                        onNotificationPress={() => navigation.navigate("Notifications")}
                    />
                ),
            }}
            />
             <AnalyzerStack.Screen name="PartnerPortrait" component={PartnerPotrait} 
            options={{
                header: ({ navigation }) => (
                    <CommonHeader
                        title={t("analyzer.partner_portrait")}
                        showBackButton={true}
                        onBackPress={() => navigation.goBack()}
                        showNotificationBadge={true}
                        onNotificationPress={() => navigation.navigate("Notifications")}
                    />
                ),
            }}
            />
            <AnalyzerStack.Screen name="ArgumentAnalysis" component={ArgumentAnalysis} 
            options={{
                header: ({ navigation }) => (
                    <CommonHeader
                        title={t("analyzer.arguement_analysis")}
                        showBackButton={true}
                        onBackPress={() => navigation.goBack()}
                        showNotificationBadge={true}
                        onNotificationPress={() => navigation.navigate("Notifications")}
                    />
                ),
            }}
            />
            <AnalyzerStack.Screen
                name="TextAnalysisResult"
                component={TextAnalysisResult}
                options={{
                    header: ({ navigation }) => (
                        <CommonHeader
                            title={t("analyzer.text_analysis_result")}
                            showBackButton={true}
                            onBackPress={() => navigation.goBack()}
                            showNotificationBadge={true}
                            onNotificationPress={() => navigation.navigate("Notifications")}
                        />
                    ),
                }}
            />
            <AnalyzerStack.Screen
                name="PartnerPortraitResult"
                component={PartnerPortraitResult}
                options={{
                    header: ({ navigation }) => (
                        <CommonHeader
                            title={t("analyzer.partner_portrait_result")}
                            showBackButton={true}
                            onBackPress={() => navigation.goBack()}
                            showNotificationBadge={true}
                            onNotificationPress={() => navigation.navigate("Notifications")}
                        />
                    ),
                }}
            />
            <AnalyzerStack.Screen name="LineByLineAnalysis" component={LineByLineAnalysis} options={{
                header: ({ navigation }) => (
                    <CommonHeader
                        title={t("analyzer.line_by_line_analysis")}
                        showBackButton={true}
                        onBackPress={() => navigation.goBack()}
                        showNotificationBadge={true}
                        onNotificationPress={() => navigation.navigate("Notifications")}
                    />
                ),
            }} />
            <AnalyzerStack.Screen name="ArgumentAnalysisResult" component={ArgumentAnalysisResult} options={{
                header: ({ navigation }) => (
                    <CommonHeader
                        title={t("analyzer.argument_analysis_result")}
                        showBackButton={true}
                        onBackPress={() => navigation.goBack()}
                        showNotificationBadge={true}
                        onNotificationPress={() => navigation.navigate("Notifications")}
                    />
                ),
            }} />
            <AnalyzerStack.Screen
                name="Notifications"
                component={Notifications}
                options={{
                    header: ({ navigation }) => (
                        <CommonHeader
                            title="Notifications"
                            showBackButton={true}
                            onBackPress={() => navigation.goBack()}
                        />
                    ),
                }}
            />
            <AnalyzerStack.Screen
                name="Subscription"
                component={Subscription}
                options={{
                    header: ({ navigation }) => (
                        <CommonHeader
                            title={t("settings.subscriptions")}
                            showBackButton={true}
                            onBackPress={() => navigation.goBack()}
                            showNotificationBadge={true}
                            onNotificationPress={() => navigation.navigate("Notifications")}
                        />
                    ),
                }}
            />
            <AnalyzerStack.Screen
                name="RelationshipTimeline"
                component={RelationshipTimeline}
                options={{
                    headerShown: false,
                }}
            />
        </AnalyzerStack.Navigator>
    );
};

export default AnalyzerStackNavigator;