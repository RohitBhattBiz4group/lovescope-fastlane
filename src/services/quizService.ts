    import { ICreateQuizRequest, ICreateQuizResponse, ICreateQuizWithQuestionsRequest, IFriendQuizSection, IGroupQuizSection, IPreQuizResponse, IQuizDetailResponse, IQuizResponseDetail, ISubmitQuizAnswersRequest, IViewQuizResponseRequest, IGenerateQuizTitleRequest, IGenerateQuizTitleResponse } from "../interfaces/quizInterfaces";
import { IApiResponseCommonInterface } from "../interfaces/authInterfaces";
import { http } from "../utils/http";
import endpoints from "../constants/endpoints";

/**
 * QuizService handles all quiz-related API operations including
 * creating, sharing, fetching, and submitting quizzes.
 */
class QuizService {
    
    /**
     * Creates a new quiz with the provided configuration.
     * @param data - The quiz creation request containing quiz details
     * @returns Promise with the created quiz response including quiz ID
     */
    createNewQuiz = async (data: ICreateQuizRequest) : Promise<IApiResponseCommonInterface<ICreateQuizResponse>> => {
        return await http.post(endpoints.quiz.CREATE, data)
    }

    /**
     * Shares a quiz with predefined questions to a friend or group.
     * @param data - The quiz data including questions to share
     * @returns Promise with the shared quiz response
     */
    shareQuiz = async (data: ICreateQuizWithQuestionsRequest) : Promise<IApiResponseCommonInterface<ICreateQuizResponse>> => {
        return await http.post(endpoints.quiz.SHARE_QUIZ, data)
    }

    /**
     * Retrieves a paginated list of quizzes associated with a specific friend.
     * @param friend_id - The unique identifier of the friend
     * @param page - The page number for pagination
     * @param limit - The number of items per page
     * @returns Promise with an array of friend quiz sections grouped by date
     */
    getFriendQuizList = async (friend_id:number,page:number,limit:number) : Promise<IApiResponseCommonInterface<IFriendQuizSection[]>> => {
        return await http.get(endpoints.quiz.GET_FRIEND_QUIZ.replace("{friend_id}", String(friend_id)), { params: { page, limit } })
    }

    /**
     * Retrieves a paginated list of quizzes associated with a specific group.
     * @param group_id - The unique identifier of the group
     * @param page - The page number for pagination
     * @param limit - The number of items per page
     * @returns Promise with an array of group quiz sections grouped by date
     */
    getGroupQuizList = async (group_id:number,page:number,limit:number) : Promise<IApiResponseCommonInterface<IGroupQuizSection[]>> => {
        return await http.get(endpoints.quiz.GET_GROUP_QUIZ.replace("{group_id}", String(group_id)), { params: { page, limit } })
    }

    /**
     * Fetches detailed information about a specific quiz including its questions.
     * @param quiz_id - The unique identifier of the quiz
     * @returns Promise with the complete quiz details
     */
    getQuizDetail = async (quiz_id: number): Promise<IApiResponseCommonInterface<IQuizDetailResponse>> => {
        return await http.get(endpoints.quiz.QUIZ_DETAIL.replace("{quiz_id}", String(quiz_id)))
    }

    /**
     * Submits the user's answers for a quiz.
     * @param data - The submission request containing quiz ID and selected answers
     * @returns Promise indicating submission success or failure
     */
    submitQuizAnswers = async (data: ISubmitQuizAnswersRequest): Promise<IApiResponseCommonInterface<null>> => {
        return await http.post(endpoints.quiz.SUBMIT_ANSWERS, data)
    }

    /**
     * Retrieves the response/results for a completed quiz.
     * @param data - The request containing quiz and user identifiers
     * @returns Promise with the detailed quiz response including scores
     */
    viewQuizResponse = async (data: IViewQuizResponseRequest): Promise<IApiResponseCommonInterface<IQuizResponseDetail>> => {
        return await http.post(endpoints.quiz.VIEW_RESPONSE, data)
    }

    /**
     * Fetches the list of pre-made/template quizzes available in the system.
     * @returns Promise with an array of pre-made quiz templates
     */
    getPreMadeQuizList = async (): Promise<IApiResponseCommonInterface<IPreQuizResponse[]>> => {
        return await http.get(endpoints.quiz.PRE_MADE_QUIZ)
    }

    /**
     * Syncs quiz summary to chat for further discussion.
     * Transfers the quiz response summary to the chat interface so users can
     * continue the conversation with AI assistance.
     * @param data - Contains profile_id, message/summary, and quiz_id to sync
     * @returns Promise indicating success or failure of the sync operation
     */
    syncSummaryToChat = async (data: { profile_id: number; message: string; quiz_id: number }): Promise<IApiResponseCommonInterface<null>> => {
        return await http.post(endpoints.quiz.SYNC_SUMMARY_TO_CHAT, data)
    }

    /**
     * Generates a quiz title using AI based on the quiz purpose and optional profile name.
     * @param data - Contains purpose and optional profile_name
     * @returns Promise with the generated quiz title
     */
    generateTitle = async (data: IGenerateQuizTitleRequest): Promise<IApiResponseCommonInterface<IGenerateQuizTitleResponse>> => {
        return await http.post(endpoints.quiz.GENERATE_TITLE, data)
    }

    getQuizCount = async (): Promise<IApiResponseCommonInterface<number>> => {
        return await http.get(endpoints.quiz.COUNT)
    }
}

export default new QuizService();