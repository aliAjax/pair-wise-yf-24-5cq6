export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type PrivacyRiskLevel = (typeof RISK_LEVELS)[number];
