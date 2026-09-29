import type { DiffType } from "./DiffType";
import type { PrivacyRiskLevel } from "./PrivacyRiskLevel";
import type { ReviewStatus } from "./ReviewStatus";

export interface DiffResult {
  id: number;
  old_document_id: number;
  new_document_id: number;
  /** 新版条款 id；ADDED 时为空 */
  section_id: number | null;
  /** 旧版条款 id；REMOVED 时为空 */
  old_section_id: number | null;
  section_no: string;
  heading: string;
  diff_type: DiffType;
  summary: string;
  /** 新版正文指纹；审查员确认结论绑定该指纹，内容变了就失效 */
  content_hash: string | null;
  risk_level: PrivacyRiskLevel;
  status: ReviewStatus;
  /** 被哪条差异结果取代（导入更新版本重新对比后，旧结论成为历史） */
  superseded_by: number | null;
  created_at: string;
  reviewed_at: string | null;
  reviewer: string;
}
