import type { PrivacyRiskLevel } from "../types/PrivacyRiskLevel";

export const RISK_LEVELS: readonly PrivacyRiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const RISK_LEVEL_TEXT: Record<PrivacyRiskLevel, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  CRITICAL: "严重"
};

/** 风险等级展示色板，RiskTag 与风险页筛选器共用 */
export const RISK_LEVEL_TONE: Record<PrivacyRiskLevel, string> = {
  LOW: "#5b8a72",
  MEDIUM: "#c08a2e",
  HIGH: "#d2691e",
  CRITICAL: "#c0392b"
};

export const RISK_LEVEL_FILTERS: PrivacyRiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
