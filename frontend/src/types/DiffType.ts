export const DiffTypeValues = ["ADDED", "REMOVED", "MODIFIED", "MOVED", "UNCHANGED"] as const;
export type DiffType = (typeof DiffTypeValues)[number];
