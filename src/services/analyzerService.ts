import endpoints from "../constants/endpoints";
import { AnalyzerResponse, ITextAnalyzer, IImageAnalyzer, ISyncToChat, IPortraitGenerate, IPortraitGenerateResponse, LineByLineRequest, LineByLineResponse, TextAnalysisResponse } from "../interfaces/analyzerInterfaces";
import { IApiResponseCommonInterface } from "../interfaces/authInterfaces";
import { http } from "../utils/http";

/**
 * Service class for handling analyzer related API operations.
 * Provides methods for managing analyzer data and password changes.
 */
class analyzerService {
    /**
     * Analyzes text conversation and returns emotional insights.
     * Processes the conversation text to detect emotions, tone, and provides
     * suggested replies and recommendations.
     * @param data - The text analyzer input containing profile, conversation text, and context
     * @returns Promise with analysis results including emotions, tone, subtext, and insights
     */
    textAnalysis = async (data: ITextAnalyzer): Promise<IApiResponseCommonInterface<AnalyzerResponse>> => {
        return http.post(endpoints.analyzer.TEXT_ANALYSIS, data);
    };

    /**
     * Analyzes uploaded images for emotional context.
     * Processes screenshot images of conversations to extract emotional insights
     * and relationship dynamics.
     * @param data - The image analyzer input containing profile, image URLs, and context
     * @returns Promise with analysis results including emotions, tone, and recommendations
     */
    imageAnalysis = async (data: IImageAnalyzer): Promise<IApiResponseCommonInterface<AnalyzerResponse>> => {
        return http.post(endpoints.analyzer.IMAGE_ANALYZER, data);
    };

    /**
     * Performs line-by-line analysis for text-based conversation input.
     * @param data - Payload containing profile_id and text conversation content
     * @returns Promise with line-by-line analysis response
     */
    lineByLineTextAnalysis = async (data: LineByLineRequest): Promise<IApiResponseCommonInterface<LineByLineResponse>> => {
        return http.post(endpoints.analyzer.LINE_BY_LINE_TEXT, data);
    };

    /**
     * Performs line-by-line analysis for image-based conversation input.
     * @param data - Payload containing profile_id and conversation image URLs
     * @returns Promise with line-by-line analysis response
     */
    lineByLineImageAnalysis = async (data: LineByLineRequest): Promise<IApiResponseCommonInterface<LineByLineResponse>> => {
        return http.post(endpoints.analyzer.LINE_BY_LINE_IMAGE, data);
    };

    /**
     * Retrieves text analyses for a given profile.
     * @param profileId - The ID of the profile to fetch text analyses for
     * @returns Promise with a list of text analysis results
     */
    getTextAnalyses = async (profileId: number): Promise<IApiResponseCommonInterface<TextAnalysisResponse>> => {
        return http.get(endpoints.analyzer.GET_TEXT_ANALYSES.replace("{profile_id}", profileId.toString()));
    };

    /**
     * Syncs analysis results to chat for further discussion.
     * Transfers the analysis summary to the chat interface so users can
     * continue the conversation with AI assistance.
     * @param data - Contains profile_id and the message/summary to sync
     * @returns Promise indicating success or failure of the sync operation
     */
    syncToChat = async (data: ISyncToChat): Promise<IApiResponseCommonInterface<null>> => {
        return http.post(endpoints.analyzer.SYNC_WITH_CHAT, data);
    };

    /**
     * Generates a portrait analysis for a given profile.
     * @param data - Payload containing profile_id and whether to use mock data
     * @returns Promise with generated portrait analysis response
     */
    generatePortrait = async (data: IPortraitGenerate): Promise<IApiResponseCommonInterface<IPortraitGenerateResponse>> => {
        return http.post(endpoints.portrait.GENERATE, data);
    };
}

export default new analyzerService();