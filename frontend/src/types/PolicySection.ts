import type { PrivacyRiskLevel } from "./PrivacyRiskLevel";
import type { SectionCategory } from "./SectionCategory";

export interface PolicySection {
  id: number;
  document_id: number;
  section_no: string;
  heading: string;
  content: string;
  category: SectionCategory;
  risk_level: PrivacyRiskLevel;
  /** 跨版本对齐条款用的稳定键，默认取 section_no */
  match_key: string;
  /** 内容指纹，重新对比时据此判断条款是否又被改动 */
  content_hash: string;
}
