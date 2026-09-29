import type { DiffResult } from "../types/DiffResult";

/** 差异结果构造器 */
export const createDefaultDiffResult = (overrides: Partial<DiffResult> = {}): DiffResult => ({
  id: 0,
  old_document_id: 0,
  new_document_id: 0,
  section_id: null,
  old_section_id: null,
  section_no: "",
  heading: "",
  diff_type: "UNCHANGED",
  summary: "",
  content_hash: null,
  risk_level: "LOW",
  status: "OPEN",
  superseded_by: null,
  created_at: "",
  reviewed_at: null,
  reviewer: "",
  ...overrides
});

export const createDiffResultForm = (): Partial<DiffResult> => ({
  diff_type: "MODIFIED",
  status: "OPEN"
});

export const createDiffResultResponse = (overrides: Partial<DiffResult> = {}): DiffResult =>
  createDefaultDiffResult(overrides);
