export interface IProfileData {
  name: string;
  age: number;
  gender: string;
  relationship_tag: string;
  description?: string | null;
}

export interface IQuizQuestion {
  question: string;
}

export interface ICreateQuizRequest {
  title: string;
  purpose: string;
  group_id?: number | null;
  target_user_id?: number | null;
  profile_id: number;
  no_of_question: number;
  timeline_reference?: string | null;
  quiz_category?: string | null;
  selected_event_id?: string | null;
  selected_event_summary?: string | null;
}

export interface ICreateQuizWithQuestionsRequest extends ICreateQuizRequest {
  quiz_questions: IQuizQuestion[];
}

export interface ICreateQuizResponse {
  profile: IProfileData;
  quiz_questions: IQuizQuestion[];
  quiz_title: string;
  quiz_purpose: string;
}

export interface IFriendQuizItem {
  id: number;
  quiz_type: string;
  target_user_id?: number | null;
  created_by: number;
  profile_id: number;
  profile_name: string;
  total_questions: number;
  title: string;
  purpose: string;
  status: string;
  created_at: string;
}

export interface IFriendQuizSection {
  created_date: string;
  quizzes: IFriendQuizItem[];
}

export interface IGroupQuizItem {
  id: number;
  quiz_type: string;
  group_id?: number | null;
  group_name: string;
  title: string;
  purpose: string;
  status: string;
  total_questions: number;
  created_at?: string | null;
  created_by: number;
  creator_name: string;
  creator_image?: string | null;
  profile_id: number;
  profile_name: string;
  group_icon_url?: string | null;
  has_responded: boolean;
  quiz_response_count?: number;
}

export interface IGroupQuizSection {
  created_date: string;
  quizzes: IGroupQuizItem[];
}

// Combined type for quiz items used in QuizResponse screen
export type IQuizItem = IFriendQuizItem & Partial<IGroupQuizItem>;

export interface IQuizQuestionDetail {
  id: number;
  question_text: string;
  question_order: number
}

export interface IQuizDetailResponse {
  id: number;
  quiz_type: string;
  group_id?: number | null;
  target_user_id?: number | null;
  created_by: number;
  title: string;
  created_at?: string | null;
  love_profile_name: string;
  questions: IQuizQuestionDetail[];
}

export interface ISubmitQuizAnswersRequest {
  quiz_id: number;
  answers: Record<number, string>;
}

export interface IViewQuizResponseRequest {
  quiz_id: number;
  responded_by: number;
}

export interface IQuestionAnswer {
  question_id: number;
  question_text: string;
  question_order: number;
  answer_text: string;
}

export interface IQuizResponseDetail {
  quiz_id: number;
  quiz_title: string;
  quiz_purpose: string;
  quiz_type: string;
  love_profile_name: string;
  created_by: number;
  responded_by: number;
  response_id: number;
  submitted_at?: string | null;
  question_answers: IQuestionAnswer[];
  summary?: string | null;
  full_summary?: string | null;
}


export interface IPreQuizResponse {
  quiz_id: number;
  quiz_title: string;
  quiz_purpose: string;
  no_of_questions: number;
}

export interface IGenerateQuizTitleRequest {
  purpose: string;
  profile_name?: string | null;
}

export interface IGenerateQuizTitleResponse {
  title: string;
}