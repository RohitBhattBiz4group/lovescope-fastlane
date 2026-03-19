import endpoints from "../constants/endpoints";
import { IApiResponseCommonInterface } from "../interfaces/authInterfaces";
import { TimelineResponse, TimelineEvent, TimelineSummaryResponse } from "../interfaces/timelineInterface";
import * as http from "../utils/http";

class TimelineService {
  getTimelineSummary = async (
    loveProfileId: number,
    scope: string
  ): Promise<IApiResponseCommonInterface<TimelineSummaryResponse>> => {
    const url = `${endpoints.timeline.GET_TIMELINE_SUMMARY}/${loveProfileId}`;
    return http.get(url, { scope });
  };

  getTimeline = async (
    loveProfileId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<IApiResponseCommonInterface<TimelineResponse>> => {
    const url = `${endpoints.timeline.GET_TIMELINE}/${loveProfileId}`;
    return http.get(url, { page, limit });
  };

  updateTimelineEntry = async (
    timelineId: number,
    title: string,
    date: string,
    summary?: string | null,
    unclear_date?: boolean,
    time?: string
  ): Promise<IApiResponseCommonInterface<TimelineEvent>> => {
    const url = `${endpoints.timeline.UPDATE_TIMELINE_ENTRY}/${timelineId}`;
    return http.put(url, { title, date, summary, unclear_date, time });
  };

  deleteTimelineEntry = async (
    timelineId: number
  ): Promise<IApiResponseCommonInterface<null>> => {
    const url = `${endpoints.timeline.DELETE_TIMELINE_ENTRY}/${timelineId}`;
    return http.remove(url);
  };
}

export default new TimelineService();

