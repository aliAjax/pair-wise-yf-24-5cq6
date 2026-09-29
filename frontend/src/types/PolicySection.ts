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
  /** 条款正文归一化后的指纹，用于判断“条款内容是否变过” */
  content_hash: string;
  /** 是否为本版新增（对比上一版时产生），供风险标注页突出显示 */
  is_newly_added: boolean;
}
