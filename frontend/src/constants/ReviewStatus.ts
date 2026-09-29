import type { ReviewStatus } from "../types/ReviewStatus";

export const REVIEW_STATUSES: readonly ReviewStatus[] = ["OPEN", "CONFIRMED", "IGNORED", "RESOLVED"];

export const REVIEW_STATUS_TEXT: Record<ReviewStatus, string> = {
  OPEN: "待处理",
  CONFIRMED: "已确认",
  IGNORED: "已忽略",
  RESOLVED: "已解决"
};

/** 确认后条款内容再次变化时，审阅状态回退到的状态 */
export const REVIEW_STATUS_REOPENED: ReviewStatus = "OPEN";

export const REVIEW_STATUS_FILTERS: ReviewStatus[] = ["OPEN", "CONFIRMED", "IGNORED", "RESOLVED"];
