import type { DiffType } from "./DiffType";
import type { PrivacyRiskLevel } from "./PrivacyRiskLevel";

export interface DiffResult {
  id: number;
  old_document_id: number | null;
  new_document_id: number | null;
  /** MODIFIED/REMOVED 指向旧条款，ADDED 指向新条款 */
  section_id: number | null;
  old_section_id: number | null;
  new_section_id: number | null;
  /** 跨版本对齐条款用的稳定键 */
  match_key: string;
  diff_type: DiffType;
  summary: string;
  risk_level: PrivacyRiskLevel;
  created_at: string;
  /** 生成该差异时新条款的内容指纹；条款再变时与当前指纹比对，用于确认退回 */
  content_hash: string;
}
