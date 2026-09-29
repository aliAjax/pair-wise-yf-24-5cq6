export const ReviewStatusValues = ["OPEN", "CONFIRMED", "IGNORED", "RESOLVED"] as const;
export type ReviewStatus = (typeof ReviewStatusValues)[number];
