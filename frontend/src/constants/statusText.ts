import { DiffTypeText } from "./DiffType";
import { PrivacyRiskLevelText } from "./PrivacyRiskLevel";
import { ReviewStatusText } from "./ReviewStatus";
import { SectionCategoryText } from "./SectionCategory";

/** 统一状态文案出口：formatters 与各展示组件都从这里取文案 */
export const STATUS_TEXT = {
  DiffType: DiffTypeText,
  PrivacyRiskLevel: PrivacyRiskLevelText,
  ReviewStatus: ReviewStatusText,
  SectionCategory: SectionCategoryText
} as const;
