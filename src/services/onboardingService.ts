import endpoints from "../constants/endpoints";
import {
    AnswerRequestPayload,
    IAnswerResponse,
    IAllAnswersResponse,
    IQuestion,
    IQuestionListResponse,
    IOnboardingPagesResponse,
    ISubmitOnboardingResponsesPayload,
    IOnboardingResponsesResponse,
} from "../interfaces/onboardingInterfaces";
import { http } from "../utils/http";

class OnboardingService {
    fetchQuestion = async(): Promise<IQuestionListResponse> => {
        return http.get(endpoints.onboarding.QUESTIONS);
    }

    submitAnswer = async (payload: AnswerRequestPayload) : Promise<IAnswerResponse> => {
        return http.post(endpoints.onboarding.ANSWER_QUESTION, payload)
    } 

    updateOnboardingStatus = async(): Promise<IAnswerResponse> => {
        return http.post(endpoints.onboarding.UPDATE_ONBOARDING_STATUS)
    }

    completeProfileCreation = async(): Promise<IAnswerResponse> => {
        return http.post(endpoints.onboarding.COMPLETE_PROFILE_CREATION)
    }

    updateOnboardingField = async(field: string, value: boolean): Promise<IAnswerResponse> => {
        return http.patch(endpoints.onboarding.UPDATE_ONBOARDING_FIELD, { field, value })
    }

    fetchAnswer = async(question_id: number): Promise <IAnswerResponse> => {
        if (typeof question_id !== "number" || Number.isNaN(question_id)) {
            throw new Error(`fetchAnswer requires a valid question_id. Received: ${String(question_id)}`);
        }

        return http.get(`${endpoints.onboarding.FETCH_ANSWER}/${question_id}`);
    }

    fetchAllAnswers = async(): Promise<IAllAnswersResponse> => {
        return http.get(endpoints.onboarding.FETCH_ALL_ANSWERS);
    }

    // ── Page-based onboarding methods ──────────────────────────────────

    fetchOnboardingPages = async(): Promise<IOnboardingPagesResponse> => {
        return http.get(endpoints.onboarding.QUESTION_PAGES);
    }

    submitOnboardingResponses = async(payload: ISubmitOnboardingResponsesPayload): Promise<IAnswerResponse> => {
        return http.post(endpoints.onboarding.SUBMIT_RESPONSES, payload);
    }

    fetchOnboardingResponses = async(): Promise<IOnboardingResponsesResponse> => {
        return http.get(endpoints.onboarding.FETCH_RESPONSES);
    }
}

export default new OnboardingService