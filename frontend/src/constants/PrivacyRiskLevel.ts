import { PrivacyRiskLevelValues, type PrivacyRiskLevel as PrivacyRiskLevelT } from "../types/PrivacyRiskLevel";

/** PrivacyRiskLevel 常量：构造器、风险规则、日志、筛选与 RiskTag 展示均引用本处 */
export const PrivacyRiskLevel = PrivacyRiskLevelValues;
export type PrivacyRiskLevel = PrivacyRiskLevelT;
export const PrivacyRiskLevelText: Record<PrivacyRiskLevel, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  CRITICAL: "严重"
};
export const PrivacyRiskLevelOrder: Record<PrivacyRiskLevel, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3
};
