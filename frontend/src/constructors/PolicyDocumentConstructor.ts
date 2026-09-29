import type { PolicyDocument } from "../types/PolicyDocument";

export const createDefaultPolicyDocument = (overrides: Partial<PolicyDocument> = {}): PolicyDocument => ({
  id: 0,
  title: "",
  version_label: "",
  raw_text: "",
  normalized_sections: "[]",
  imported_at: "",
  ...overrides
});

/** 文档导入表单对象 */
export const createPolicyDocumentForm = (): Pick<PolicyDocument, "title" | "version_label" | "raw_text"> => ({
  title: "",
  version_label: "",
  raw_text: ""
});

/** 导入提交后落库 / 返回给页面的对象 */
export const createPolicyDocumentResponse = (
  payload: Pick<PolicyDocument, "title" | "version_label" | "raw_text" | "normalized_sections">,
  id: number,
  importedAt = new Date().toISOString()
): PolicyDocument =>
  createDefaultPolicyDocument({
    ...payload,
    id,
    imported_at: importedAt
  });
