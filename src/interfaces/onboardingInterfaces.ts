import { IApiResponseCommonInterface } from "./authInterfaces";

export type QuestionType =
    | "text"
    | "radio"
    | "checkbox"
    | "multiselect"
    | "dropdown"
    | "card_options"
    | "range"
    | "section"
    | "pill";

export interface IQuestionOption {
    text: string;
    description?: string;
    value?: string;
}

export interface IQuestionRange {
    min: number;
    max: number;
}

export interface IQuestion {
    id: number;
    question: string;
    question_type: QuestionType;
    order_index: number;
    is_active: boolean;
    options?: IQuestionOption[] | null;
    range?: IQuestionRange | null;
    is_parent?: boolean;
    parent_question_id?: number | null;
    children?: IQuestion[];
}

export type OnboardingAnswerValue = string | number | string[];

export interface AnswerRequestPayload {
    question_id: number;
    answer: OnboardingAnswerValue;
}

export interface IFetchedAnswer {
    question_id: number;
    answer: OnboardingAnswerValue;
}

export interface IQuestionListResponse extends IApiResponseCommonInterface<IQuestion[]> {}
export interface IAnswerResponse extends IApiResponseCommonInterface<IFetchedAnswer> {}
export interface IAllAnswersResponse extends IApiResponseCommonInterface<Record<number, OnboardingAnswerValue>> {}

// ── Page-based onboarding interfaces ──────────────────────────────────

export interface IPageQuestion {
    id: number;
    question_title: string | null;
    question_type: QuestionType;
    question_order: number;
    options?: Record<string, any>[] | null;
    depends_on_question_id?: number | null;
    depends_on_option_value?: string | null;
    is_optional: boolean;
}

export interface IOnboardingPage {
    id: number;
    page_key: string;
    page_title: string;
    page_subtext?: string | null;
    page_order: number;
    questions: IPageQuestion[];
}

export interface ISingleResponsePayload {
    question_id: number;
    selected_option_values?: string[] | null;
    answer_text?: string | null;
    answer_numeric?: number | null;
}

export interface ISubmitOnboardingResponsesPayload {
    responses: ISingleResponsePayload[];
}

export interface IPageResponseData {
    selected_option_values?: string[] | null;
    answer_text?: string | null;
    answer_numeric?: number | null;
}

export interface IOnboardingPagesResponse extends IApiResponseCommonInterface<IOnboardingPage[]> {}
export interface IOnboardingResponsesResponse extends IApiResponseCommonInterface<Record<number, IPageResponseData>> {}
