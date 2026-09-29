export const REVIEW_STATUSES = ["OPEN", "CONFIRMED", "IGNORED", "RESOLVED"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
