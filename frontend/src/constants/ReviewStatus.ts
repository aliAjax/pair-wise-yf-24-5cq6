import { ReviewStatusValues, type ReviewStatus as ReviewStatusT } from "../types/ReviewStatus";

/** ReviewStatus 常量：审阅清单、store、构造器、日志、筛选与 StatusBadge 均引用本处 */
export const ReviewStatus = ReviewStatusValues;
export type ReviewStatus = ReviewStatusT;
export const ReviewStatusText: Record<ReviewStatus, string> = {
  OPEN: "待处理",
  CONFIRMED: "已确认",
  IGNORED: "已忽略",
  RESOLVED: "无需处理"
};
