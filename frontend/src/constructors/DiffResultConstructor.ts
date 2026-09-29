import type { DiffResult } from "../types/DiffResult";
import type { DiffType } from "../types/DiffType";
import type { PrivacyRiskLevel } from "../types/PrivacyRiskLevel";

export interface DiffResultBuildInput {
  id: number;
  oldDocumentId: number | null;
  newDocumentId: number | null;
  oldSectionId: number | null;
  newSectionId: number | null;
  matchKey: string;
  diffType: DiffType;
  summary: string;
  riskLevel: PrivacyRiskLevel;
  contentHash: string;
  createdAt?: string;
}

export const createDefaultDiffResult = (overrides: Partial<DiffResult> = {}): DiffResult => ({
  id: 0,
  old_document_id: null,
  new_document_id: null,
  section_id: null,
  old_section_id: null,
  new_section_id: null,
  match_key: "",
  diff_type: "UNCHANGED",
  summary: "",
  risk_level: "LOW",
  created_at: "",
  content_hash: "",
  ...overrides
});

/** 对比引擎产出一条差异结果的唯一入口 */
export const createDiffResultFromInput = (input: DiffResultBuildInput): DiffResult =>
  createDefaultDiffResult({
    id: input.id,
    old_document_id: input.oldDocumentId,
    new_document_id: input.newDocumentId,
    // section_id 保留“主条款”语义：改动/移除取旧条款，新增取新条款
    section_id: input.newSectionId ?? input.oldSectionId,
    old_section_id: input.oldSectionId,
    new_section_id: input.newSectionId,
    match_key: input.matchKey,
    diff_type: input.diffType,
    summary: input.summary,
    risk_level: input.riskLevel,
    content_hash: input.contentHash,
    created_at: input.createdAt ?? new Date().toISOString()
  });

export const createDiffResultForm = createDefaultDiffResult;
export const createDiffResultResponse = createDefaultDiffResult;
