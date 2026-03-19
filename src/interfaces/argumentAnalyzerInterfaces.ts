export interface ProfileData {
  name: string;
  age: number;
  gender: string;
  relationship_tag: string;
  description?: string;
}

export interface AnalyseArgumentRequest {
  profile_id: number;
  context: string;
  type: string;
  image_url?: string[];
  conversation_text?: string;
  timeline_reference?: string | null;
  selected_event_id?: string | null;
  selected_event_title?: string | null;
  selected_event_summary?: string | null;
}

export interface ToneBreakdown {
  calm: number;
  defensive: number;
  upset: number;
  hurt: number;
  cold: number;
  dismissive: number;
  frustrated: number;
  angry: number;
}

export interface ToneComparison {
  user: ToneBreakdown;
  partner: ToneBreakdown;
}

export interface AccountabilityBreakdown {
  user_accountability_percent: number;
  partner_accountability_percent: number;
  reasoning: string;
}

export interface EmotionalMaturityScore {
  user_score: number;
  partner_score: number;
  reasoning: string;
}

export interface EthicalResponsibilityBalance {
  user_percent: number;
  partner_percent: number;
  reasoning: string;
}

export interface KeyMoment {
  speaker: "user" | "partner";
  percent: number;
  message: string;
  explanation: string;
}

export interface KeyMoments {
  escalation_point: KeyMoment[];
  stonewalling: KeyMoment[];
  repair_attempt: KeyMoment[];
}

export interface ConflictPattern{
  pattern: string;
  explanation: string;
}

export interface HiddenMeaningAnalysis {
  message : string;
  pointers : string[];
}

export interface ArgumentAnalysisResponse {
  profile: ProfileData;
  insufficient_data: boolean;
  insufficient_data_message: string | null;
  tone_comparison: ToneComparison;
  accountability_breakdown: AccountabilityBreakdown;
  emotional_maturity_score: EmotionalMaturityScore;
  ethical_responsibility_balance: EthicalResponsibilityBalance;
  final_summary_short: string;
  final_summary_detailed: string;
  hidden_meaning_analysis: HiddenMeaningAnalysis[];
  key_moments: KeyMoments;
  conflict_pattern: ConflictPattern;
}

export interface ArgumentFormValue {
  conversation_text?: string | null;
  context?: string | null;
  type?: string | null;
  image_url?: string[] | null;
}

export interface ArgumentFormDataResponse {
  profile_id: number;
  form_value: ArgumentFormValue;
}
