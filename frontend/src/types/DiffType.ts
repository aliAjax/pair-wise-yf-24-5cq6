export const DIFF_TYPES = ["ADDED", "REMOVED", "MODIFIED", "MOVED", "UNCHANGED"] as const;
export type DiffType = (typeof DIFF_TYPES)[number];
