export type TimelineEventCategory =
  | 'introduction'
  | 'milestone'
  | 'emotional'
  | 'communication'
  | 'gesture'
  | 'conflict'
  | 'affection';

export interface TimelineEvent {
  id?: number;
  title: string;
  date: string;
  time?: string;
  description?: string | null;
  category: TimelineEventCategory | string;
  unclear_date?: boolean;
}

export interface TimelineResponse {
  timeline_events: TimelineEvent[];
  total_conversations_analyzed: number;
  total_entries?: number;
  page?: number;
  limit?: number;
  has_more?: boolean;
}

export interface TimelineSummaryEvent {
  id: number;
  title: string;
}

export interface TimelineSummaryResponse {
  total_count: number;
  characters_pulled: number;
  timeline_events: TimelineSummaryEvent[];
}

