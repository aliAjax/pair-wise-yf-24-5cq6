export const PrivacyRiskLevelValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type PrivacyRiskLevel = (typeof PrivacyRiskLevelValues)[number];
