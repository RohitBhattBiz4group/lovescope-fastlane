import { InputFormatType } from "../constants/commonConstant";

export interface ITextAnalyzer {
    profile: number;
    input_type: InputFormatType;
    conversation_text: string;
    context: string;
    specify_output_context?: string;
    timeline_reference?: string;
    selected_event_id?: string;
    selected_event_summary?: string;
}

export interface IImageAnalyzer {
    profile: number;
    input_type: InputFormatType;
    context: string;
    specify_output_context?: string;
    image_url: string[];
    timeline_reference?: string;
    selected_event_id?: string;
    selected_event_summary?: string;
}

export interface MessageAnalysis {
    message: string;
    speaker: string;
    analysis?: string | null;
}

export interface LineByLineRequest {
    profile_id: number;
    conversation_text?: string | null;
    conversation_image?: string[] | null;
    input_format: InputFormatType;
    context?: string | null;
    fingerprint?: string;
}

export interface LineByLineResponse {
    profile_name: string;
    profile: Profile;
    input_format: InputFormatType;
    messages: MessageAnalysis[];
    overall_summary?: string | null;
}

export interface AnalysisInsight {
    category: string;
    insight: string;
    confidence?: string | null;
}

export interface WatchOutFor {
    message: string,
    context: string
}

export interface SuggestedReply {
    guidance: string;
    why_this_helps: string;
    timing_note: string;
}

export interface Profile {
    name: string;
    initials: string;
    age: number;
    gender: string;
    relationship_tag: string;
}

export interface AnalyzerResponse {
    profile: Profile;
    profile_name: string;
    input_format: InputFormatType;
    summary: string;
    detected_emotions?: string[] | null;
    overall_tone?: string | null;
    subtext?: string | null;
    specified_analysis?: string | null;
    suggested_reply?: SuggestedReply | null;
    insights: AnalysisInsight[];
    recommendations?: string[] | null;
    predictions?: string[] | null;
    watch_out_for?: WatchOutFor[] | null;
}

export interface TextAnalysisFormValue {
    conversation_text?: string | null;
    context?: string | null;
    specify_output?: string | null;
    type?: string | null;
    image_url?: string[] | null;
    timeline_reference?: string | null;
    selected_event_id?: string | null;
    selected_event_title?: string | null;
    selected_event_summary?: string | null;
}

export interface TextAnalysisResponse {
    profile_id: number;
    form_value: TextAnalysisFormValue;
    timeline_reference?: string | null;
    event_id?: string | null;
    event_title?: string | null;
    event_summary?: string | null;
}

export interface ISyncToChat {
    profile_id: number,
    message: string,
    request_fingerprint?: string
}

export interface IPortraitGenerate {
    profile_id: number,
}

export interface IPortraitGenerateResponse {
    profile: Profile;
    profile_name: string;
    key_insights: string[];
    partner_persona: string;
    sections: PortraitSection[];
    has_summary: boolean;
}

export interface PortraitSection {
    section_name: string;
    title: string;
    percentage?: number | null;
    percentage_label?: string | null;
    scale?: number | null;
    tags?: string[] | null;         
    context: string;
    change_percentile?: number | null;
    change_direction?: string | null;
}