import type { ReviewStatus } from "./ReviewStatus";

export interface ReviewNote {
  id: number;
  diff_result_id: number;
  tag: string;
  comment: string;
  reviewer: string;
  status: ReviewStatus;
  /** 从哪条历史备注继承而来：导入新版本后旧结论失效，备注文字保留并带到新差异上 */
  inherited_from_note_id: number | null;
  created_at: string;
  updated_at: string;
}
