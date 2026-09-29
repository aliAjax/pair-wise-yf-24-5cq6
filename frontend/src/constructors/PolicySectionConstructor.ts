import type { PolicySection } from "../types/PolicySection";

/** 条款段落构造器 */
export const createDefaultPolicySection = (overrides: Partial<PolicySection> = {}): PolicySection => ({
  id: 0,
  document_id: 0,
  section_no: "",
  heading: "",
  content: "",
  category: "OTHER",
  risk_level: "LOW",
  content_hash: "",
  is_newly_added: false,
  ...overrides
});

export const createPolicySectionForm = (): Partial<PolicySection> => ({
  section_no: "",
  heading: "",
  content: "",
  category: "OTHER",
  risk_level: "LOW"
});

export const createPolicySectionResponse = (overrides: Partial<PolicySection> = {}): PolicySection =>
  createDefaultPolicySection(overrides);
