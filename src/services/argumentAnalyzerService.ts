import endpoints from "../constants/endpoints";
import { AnalyseArgumentRequest, ArgumentAnalysisResponse, ArgumentFormDataResponse } from "../interfaces/argumentAnalyzerInterfaces";
import { IApiResponseCommonInterface } from "../interfaces/authInterfaces";
import { http } from "../utils/http";

/**
 * Service class for handling argument analyzer related API operations.
 * Provides methods for analyzing arguments and conflicts in conversations.
 */
class argumentAnalyzerService {
    /**
     * Analyzes an argument or conflict in a conversation.
     * Processes the conversation to evaluate tone, accountability, emotional maturity,
     * and ethical responsibility between both parties.
     * @param data - The argument analysis request containing profile_id, context, type, and optional image/text
     * @returns Promise with analysis results including tone comparison, accountability, and summaries
     */
    analyseArgument = async (data: AnalyseArgumentRequest): Promise<IApiResponseCommonInterface<ArgumentAnalysisResponse>> => {
        return http.post(endpoints.argumentAnalyzer.ANALYSE_ARGUMENT, data);
    };

    /**
     * Retrieves form data for argument analysis for a given profile.
     * @param profileId - The ID of the profile to fetch form data for
     * @returns Promise with form data including previous context, type, and conversation details
     */
    getFormData = async (profileId: number): Promise<IApiResponseCommonInterface<ArgumentFormDataResponse>> => {
        return http.get(endpoints.argumentAnalyzer.GET_FORM_DATA.replace("{profile_id}", profileId.toString()));
    };
}

export default new argumentAnalyzerService();
