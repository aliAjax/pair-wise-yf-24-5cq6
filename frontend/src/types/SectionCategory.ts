export const SectionCategoryValues = [
  "DATA_COLLECTION",
  "INFORMATION_SHARING",
  "RETENTION",
  "USER_RIGHTS",
  "SECURITY",
  "CONTACT",
  "OTHER"
] as const;
export type SectionCategory = (typeof SectionCategoryValues)[number];
