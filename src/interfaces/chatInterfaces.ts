export interface IChatEvent {
    mt: string;
    message: string;
    isBot: boolean;
    chatId: string
}

export interface ICreateChat {
    loveProfileId?: number
    chatId?: number
}

export interface IConversationHistory {
    id: string;
    title: string;
    chatType: string;
    updated_ts?: string;
}

export interface IChatHistory {
    id: string,
    chatId?: number,
    message: string,
    isBot: boolean,
    messageType?: string,
    sharedBy?: string,
}