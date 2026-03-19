import endpoints from "../constants/endpoints";
import { IApiResponseCommonInterface } from "../interfaces/authInterfaces";
import { IChatHistory, IConversationHistory, ICreateChat } from "../interfaces/chatInterfaces";
import { http } from "../utils/http";

class ChatService {

    getChatHistory = async (chatId: number, skip: number, limit: number): Promise<IApiResponseCommonInterface<IChatHistory[]>> => {
        return http.get(endpoints.chat.CHAT_HISTORY.replace("{chatId}", chatId.toString()), {
            params: {
                skip,
                limit
            }
        });
    };

    createChat = async (data: ICreateChat): Promise<IApiResponseCommonInterface<{id: number}>> => {
        return http.post(endpoints.chat.CREATE_CHAT, data);
    };

    getConversationalHistory = async (skip: number, limit: number): Promise<IApiResponseCommonInterface<IConversationHistory[]>> => {
        return http.get(endpoints.chat.CONVERSATION_HISTORY,{
            params: {
                skip,
                limit
            }
        });
    };
}
export default new ChatService
