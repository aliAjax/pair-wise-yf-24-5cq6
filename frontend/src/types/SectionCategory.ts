export const SECTION_CATEGORIES = [
  "DATA_COLLECTION",
  "INFORMATION_SHARING",
  "RETENTION",
  "USER_RIGHTS",
  "CONTACT",
  "OTHER"
] as const;
export type SectionCategory = (typeof SECTION_CATEGORIES)[number];
