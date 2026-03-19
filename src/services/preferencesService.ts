import endpoints from "../constants/endpoints";
import { AnswerRequestPayload, IAnswerResponse, IAllAnswersResponse, IQuestionListResponse } from "../interfaces/onboardingInterfaces";
import { http } from "../utils/http";

class PreferencesService {
    fetchQuestions = async(): Promise<IQuestionListResponse> => {
        return http.get(endpoints.preferences.QUESTIONS);
    }

    submitAnswer = async (payload: AnswerRequestPayload): Promise<IAnswerResponse> => {
        return http.post(endpoints.preferences.ANSWER_QUESTION, payload);
    }

    fetchAnswer = async(question_id: number): Promise<IAnswerResponse> => {
        if (typeof question_id !== "number" || Number.isNaN(question_id)) {
            throw new Error(`fetchAnswer requires a valid question_id. Received: ${String(question_id)}`);
        }

        return http.get(`${endpoints.preferences.FETCH_ANSWER}/${question_id}`);
    }

    fetchAllAnswers = async(): Promise<IAllAnswersResponse> => {
        return http.get(endpoints.preferences.FETCH_ALL_ANSWERS);
    }
}

export default new PreferencesService();
