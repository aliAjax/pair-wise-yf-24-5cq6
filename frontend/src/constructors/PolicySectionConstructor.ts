import type { PolicySection } from "../types/PolicySection";
import type { ParsedSectionDraft } from "../hooks/usePolicyParser";
import { hashContent } from "../utils/hash";

export const createDefaultPolicySection = (overrides: Partial<PolicySection> = {}): PolicySection => ({
  id: 0,
  document_id: 0,
  section_no: "",
  heading: "",
  content: "",
  category: "OTHER",
  risk_level: "LOW",
  match_key: "",
  content_hash: "",
  ...overrides
});

/** 条款编辑表单（风险页改判分类/风险等级时使用） */
export const createPolicySectionForm = (
  section: PolicySection
): Pick<PolicySection, "category" | "risk_level" | "heading"> => ({
  heading: section.heading,
  category: section.category,
  risk_level: section.risk_level
});

/** 解析草稿 → 落库条款，统一在这里计算内容指纹 */
export const createPolicySectionFromDraft = (
  draft: ParsedSectionDraft,
  id: number,
  documentId: number
): PolicySection =>
  createDefaultPolicySection({
    id,
    document_id: documentId,
    section_no: draft.section_no,
    heading: draft.heading,
    content: draft.content,
    category: draft.category,
    risk_level: draft.risk_level,
    match_key: draft.match_key,
    content_hash: hashContent(`${draft.heading}\n${draft.content}`)
  });

export const createPolicySectionResponse = createDefaultPolicySection;
