import type { PolicyDocument } from "../types/PolicyDocument";

/** 政策文档构造器：默认对象 / 表单对象 / 响应对象，页面与 store 不得散写默认结构 */
export const createDefaultPolicyDocument = (overrides: Partial<PolicyDocument> = {}): PolicyDocument => ({
  id: 0,
  title: "",
  version_label: "",
  raw_text: "",
  normalized_sections: 0,
  imported_at: "",
  ...overrides
});

export const createPolicyDocumentForm = (): Partial<PolicyDocument> => ({
  title: "",
  version_label: "",
  raw_text: ""
});

export const createPolicyDocumentResponse = (overrides: Partial<PolicyDocument> = {}): PolicyDocument =>
  createDefaultPolicyDocument(overrides);
