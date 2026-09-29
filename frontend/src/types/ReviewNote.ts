import type { ReviewStatus } from "./ReviewStatus";

export interface ReviewNote {
  id: number;
  diff_result_id: number;
  tag: string;
  comment: string;
  reviewer: string;
  status: ReviewStatus;
  updated_at: string;
  /** true = 该结论曾已确认，但条款内容在新版本中又变过，被系统退回待处理 */
  reopened?: boolean;
}
