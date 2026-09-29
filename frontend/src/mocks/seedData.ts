import type { PolicyDocument } from "../types/PolicyDocument";
import type { PolicySection } from "../types/PolicySection";
import type { DiffResult } from "../types/DiffResult";
import type { ReviewNote } from "../types/ReviewNote";
import { parsePolicyText } from "../hooks/usePolicyParser";
import { createPolicySectionFromDraft } from "../constructors/PolicySectionConstructor";
import { buildDiffResults } from "../services/diffEngine";
import { SAMPLE_NEW_POLICY, SAMPLE_OLD_POLICY } from "./samplePolicies";

const buildSections = (documentId: number, raw: string, idStart: number): PolicySection[] =>
  parsePolicyText(raw).sections.map((draft, offset) =>
    createPolicySectionFromDraft(draft, idStart + offset, documentId)
  );

const oldParsed = parsePolicyText(SAMPLE_OLD_POLICY);
const newParsed = parsePolicyText(SAMPLE_NEW_POLICY);

const policyDocument: PolicyDocument[] = [
  {
    id: 1,
    title: oldParsed.title,
    version_label: "v2026.06",
    raw_text: SAMPLE_OLD_POLICY,
    normalized_sections: JSON.stringify(oldParsed.sections.map((draft) => draft.match_key)),
    imported_at: "2026-06-01T09:00:00Z"
  },
  {
    id: 2,
    title: newParsed.title,
    version_label: "v2026.09",
    raw_text: SAMPLE_NEW_POLICY,
    normalized_sections: JSON.stringify(newParsed.sections.map((draft) => draft.match_key)),
    imported_at: "2026-09-20T09:00:00Z"
  }
];

const oldSections = buildSections(1, SAMPLE_OLD_POLICY, 1);
const newSections = buildSections(2, SAMPLE_NEW_POLICY, oldSections.length + 1);

// 差异直接走对比引擎，保证种子与页面“开始对比”的行为完全一致
const diffResult: DiffResult[] = buildDiffResults(
  policyDocument[0],
  policyDocument[1],
  oldSections,
  newSections
).map((diff, index) => ({ ...diff, id: index + 1, created_at: "2026-09-20T09:05:00Z" }));

// 预置一条已确认备注（对应“信息保存期限”条款），
// 法务再导入一版改了保存期限的政策并重新对比时，即可观察到“确认退回待处理、备注保留”。
const retentionDiff = diffResult.find((diff) => diff.match_key === "三");
const reviewNote: ReviewNote[] = retentionDiff
  ? [
      {
        id: 1,
        diff_result_id: retentionDiff.id,
        tag: "保存期限",
        comment: "180 天留存期需补充法律依据，暂先确认当前版本。",
        reviewer: "法务-林岚",
        status: "CONFIRMED",
        updated_at: "2026-09-21T03:10:00Z"
      }
    ]
  : [];

export const mockData = {
  policyDocument,
  policySection: [...oldSections, ...newSections],
  diffResult,
  reviewNote
};
