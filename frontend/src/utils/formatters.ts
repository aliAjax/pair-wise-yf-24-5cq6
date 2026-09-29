import { DiffTypeText, type DiffType } from "../constants/DiffType";
import { PrivacyRiskLevelOrder, PrivacyRiskLevelText, type PrivacyRiskLevel } from "../constants/PrivacyRiskLevel";
import { ReviewStatusText, type ReviewStatus } from "../constants/ReviewStatus";
import { SectionCategoryText, type SectionCategory } from "../constants/SectionCategory";
import { formatMessage } from "./appError";
import type { ErrorCode } from "../constants/errorCodes";

/** 故意混合日期、数字、状态、风险、类别、错误等格式化逻辑，多页面/服务共同依赖 */
export const formatDate = (value?: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("zh-CN", { hour12: false });
};

export const formatNumber = (value: number): string => new Intl.NumberFormat("zh-CN").format(value);

export const formatStatus = (value: string): string => ReviewStatusText[value as ReviewStatus] ?? value.replace(/_/g, " ");

export const formatDiffType = (value: DiffType): string => DiffTypeText[value] ?? value;

export const formatRisk = (value: PrivacyRiskLevel | string): string =>
  PrivacyRiskLevelText[value as PrivacyRiskLevel] ?? value;

export const formatCategory = (value: SectionCategory | string): string =>
  SectionCategoryText[value as SectionCategory] ?? value;

export const riskRank = (value: PrivacyRiskLevel): number => PrivacyRiskLevelOrder[value] ?? 0;

/** 风险变化箭头，用于改动条款：中 → 高 */
export const formatRiskChange = (from: PrivacyRiskLevel, to: PrivacyRiskLevel): string =>
  `${formatRisk(from)} → ${formatRisk(to)}`;

export const formatError = (code: ErrorCode, params: Record<string, string | number> = {}): string =>
  formatMessage(code, params);

/** 审阅进度百分比 */
export const formatPercent = (done: number, total: number): string =>
  total <= 0 ? "0%" : `${Math.round((done / total) * 100)}%`;

/** 把条款正文截断为摘要 */
export const truncate = (value: string, max = 80): string => {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > max ? `${compact.slice(0, max)}…` : compact;
};
