import * as diffApi from "../api/DiffResult";
import * as noteApi from "../api/ReviewNote";
import * as sectionApi from "../api/PolicySection";
import type { DiffResult } from "../types/DiffResult";
import type { PolicySection } from "../types/PolicySection";
import type { ReviewNote } from "../types/ReviewNote";
import type { ReviewStatus } from "../types/ReviewStatus";
import { AppError, ERROR_CODES } from "../utils/appError";
import { buildDiffSummary } from "../utils/diffSummary";
import { recordLog } from "../utils/logger";
import { hashText } from "../utils/hash";
import { matchSections, type SectionMatch } from "../utils/sectionMatcher";
import { diffText } from "../utils/textDiffEngine";
import { getNextIds, saveNextIds } from "./policyDocumentService";

export interface PairResult {
  diffs: DiffResult[];
  oldDocumentId: number;
  newDocumentId: number;
  created: boolean;
}

export async function findDiffPair(oldDocumentId: number, newDocumentId: number): Promise<DiffResult[]> {
  const all = await diffApi.listDiffResult();
  return all.filter((diff) => diff.old_document_id === oldDocumentId && diff.new_document_id === newDocumentId);
}

/**
 * 生成（或取回）两版政策的逐条差异。
 * 关键规则：再导入更新版本后，沿“版本链”找到上一版差异——
 * 条款内容变过的，已确认结论退回 OPEN；备注原文保留并继承到新差异；
 * 内容未变（UNCHANGED/MOVED 且正文一致）的确认结论沿用。
 */
export async function ensureDiffPair(oldDocumentId: number, newDocumentId: number): Promise<PairResult> {
  if (!oldDocumentId || !newDocumentId) throw new AppError(ERROR_CODES.COMPARE_DOCUMENT_MISSING);
  if (oldDocumentId === newDocumentId) throw new AppError(ERROR_CODES.COMPARE_SAME_DOCUMENT);

  const existing = await findDiffPair(oldDocumentId, newDocumentId);
  if (existing.length > 0) return { diffs: existing, oldDocumentId, newDocumentId, created: false };

  const allSections = await sectionApi.listPolicySection();
  const oldSections = allSections.filter((section) => section.document_id === oldDocumentId);
  const newSections = allSections.filter((section) => section.document_id === newDocumentId);
  if (oldSections.length === 0 && newSections.length === 0) {
    throw new AppError(ERROR_CODES.RECORD_NOT_FOUND, { entity: "PolicySection", id: oldDocumentId });
  }

  const matches = matchSections(oldSections, newSections);
  const allDiffs = await diffApi.listDiffResult();
  const allNotes = await noteApi.listReviewNote();

  // 版本链上一版对比：new 端恰为本次的 old 文档
  const predecessorPair = latestPairEndingAt(allDiffs, oldDocumentId);
  const predecessorBySection = new Map<number, DiffResult>();
  predecessorPair.forEach((diff) => {
    if (diff.section_id !== null) predecessorBySection.set(diff.section_id, diff);
  });

  const ids = getNextIds();
  let diffSeq = ids.diff;
  let noteSeq = ids.note;
  const now = new Date().toISOString();
  const createdDiffs: DiffResult[] = [];
  const createdNotes: ReviewNote[] = [];
  const counts: Record<"added" | "removed" | "modified" | "moved" | "unchanged", number> = {
    added: 0,
    removed: 0,
    modified: 0,
    moved: 0,
    unchanged: 0
  };

  matches.forEach((match) => {
    const diff = buildDiff(match, oldDocumentId, newDocumentId, diffSeq, now);
    diffSeq += 1;
    counts[diff.diff_type.toLowerCase() as keyof typeof counts] += 1;

    const prior = match.oldSection ? predecessorBySection.get(match.oldSection.id) ?? null : null;
    if (prior) {
      carryReviewState(prior, diff, allNotes, createdNotes, () => noteSeq++);
      prior.superseded_by = diff.id;
      recordLog("DiffResult", "supersede", { id: prior.id, newId: diff.id });
    } else if (diff.diff_type === "UNCHANGED") {
      // 首次纳入对比且完全未变的条款无需法务处理
      diff.status = "RESOLVED";
    }

    createdDiffs.push(diff);
  });

  await diffApi.bulkReplaceDiffResult([...allDiffs, ...createdDiffs]);
  if (createdNotes.length > 0) await noteApi.bulkReplaceReviewNote([...allNotes, ...createdNotes]);
  saveNextIds({ ...ids, diff: diffSeq, note: noteSeq });

  recordLog("DiffResult", "regenerate", {
    oldDocId: oldDocumentId,
    newDocId: newDocumentId,
    added: counts.added,
    removed: counts.removed,
    modified: counts.modified,
    moved: counts.moved,
    unchanged: counts.unchanged
  });
  recordLog("DiffResult", "create", { id: `${ids.diff}-${diffSeq - 1}`, diffType: "PAIR", oldDocId: oldDocumentId, newDocId: newDocumentId });

  return { diffs: createdDiffs, oldDocumentId, newDocumentId, created: true };
}

function latestPairEndingAt(allDiffs: DiffResult[], documentId: number): DiffResult[] {
  const candidates = allDiffs
    .filter((diff) => diff.new_document_id === documentId && diff.superseded_by === null)
    .map((diff) => ({ old: diff.old_document_id, at: diff.created_at }));
  if (candidates.length === 0) return [];
  candidates.sort((a, b) => b.at.localeCompare(a.at));
  const oldId = candidates[0].old;
  return allDiffs.filter((diff) => diff.old_document_id === oldId && diff.new_document_id === documentId);
}

function buildDiff(
  match: SectionMatch,
  oldDocumentId: number,
  newDocumentId: number,
  id: number,
  now: string
): DiffResult {
  const { oldSection, newSection, diffType } = match;
  let addedChars = 0;
  let removedChars = 0;
  if (diffType === "MODIFIED" && oldSection && newSection) {
    const wordDiff = diffText(oldSection.content, newSection.content);
    addedChars = wordDiff.addedChars;
    removedChars = wordDiff.removedChars;
  }
  const anchor = newSection ?? oldSection;
  return {
    id,
    old_document_id: oldDocumentId,
    new_document_id: newDocumentId,
    section_id: newSection?.id ?? null,
    old_section_id: oldSection?.id ?? null,
    section_no: anchor?.section_no ?? "",
    heading: anchor?.heading ?? "",
    diff_type: diffType,
    summary: buildDiffSummary(diffType, oldSection ?? null, newSection ?? null, addedChars, removedChars),
    content_hash: newSection ? hashText(`${newSection.heading}\n${newSection.content}`) : null,
    risk_level: (newSection ?? oldSection)?.risk_level ?? "LOW",
    status: "OPEN",
    superseded_by: null,
    created_at: now,
    reviewed_at: null,
    reviewer: ""
  };
}

/**
 * 结论沿用/失效核心：
 * - 新条款正文指纹与旧确认指纹相同且类型为 UNCHANGED/MOVED => CONFIRMED 沿用；
 * - 类型为 MODIFIED/REMOVED（或旧备注存在但内容已变）=> 退回 OPEN，并写失效日志；
 * - 无论结论是否失效，历史备注原文一律保留并复制到新差异。
 */
function carryReviewState(
  prior: DiffResult,
  next: DiffResult,
  allNotes: ReviewNote[],
  createdNotes: ReviewNote[],
  takeNoteId: () => number
): void {
  const priorNotes = allNotes.filter((note) => note.diff_result_id === prior.id);
  priorNotes.forEach((note) => {
    const copy: ReviewNote = {
      ...note,
      id: takeNoteId(),
      diff_result_id: next.id,
      status: "OPEN",
      inherited_from_note_id: note.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    createdNotes.push(copy);
    recordLog("ReviewNote", "inherit", { id: copy.id, fromDiffId: prior.id, toDiffId: next.id });
  });

  const contentUnchanged = next.diff_type === "UNCHANGED" || next.diff_type === "MOVED";
  if (contentUnchanged && prior.content_hash === next.content_hash && prior.status !== "OPEN") {
    // 条款内容没变：旧结论沿用（已确认/已忽略/无需处理都继续有效，避免法务重复劳动）
    next.status = prior.status;
    next.reviewed_at = prior.reviewed_at;
    next.reviewer = prior.reviewer;
    if (prior.status === "CONFIRMED") {
      recordLog("DiffResult", "statusChange", {
        id: next.id,
        from: "CONFIRMED(沿用)",
        to: "CONFIRMED",
        reviewer: next.reviewer || "系统"
      });
    }
  } else if (prior.status === "CONFIRMED") {
    // 已确认的条款内容变过：结论退回待处理，旧备注已在上方继承保留
    next.status = "OPEN";
    next.reviewed_at = null;
    next.reviewer = "";
    recordLog("DiffResult", "invalidate", { id: next.id });
    recordLog("DiffResult", "statusChange", { id: next.id, from: "CONFIRMED", to: "OPEN", reviewer: "系统" });
  } else {
    next.status = "OPEN";
  }
}

/** 审查员在审阅清单上确认/忽略/标记无需处理 */
export async function setDiffStatus(diffId: number, status: ReviewStatus, reviewer: string): Promise<DiffResult> {
  const all = await diffApi.listDiffResult();
  const target = all.find((diff) => diff.id === diffId);
  if (!target) throw new AppError(ERROR_CODES.RECORD_NOT_FOUND, { entity: "DiffResult", id: diffId });
  const from = target.status;
  target.status = status;
  target.reviewed_at = status === "OPEN" ? null : new Date().toISOString();
  target.reviewer = reviewer || target.reviewer;
  await diffApi.updateDiffResult(target);
  recordLog("DiffResult", "statusChange", { id: diffId, from, to: status, reviewer: reviewer || "未署名" });
  return target;
}

/** 删除文档时级联清理差异与备注 */
export async function deleteCascadeForDocument(documentId: number): Promise<void> {
  const all = await diffApi.listDiffResult();
  const keep = all.filter(
    (diff) => diff.old_document_id !== documentId && diff.new_document_id !== documentId
  );
  const removed = all.filter((diff) => !keep.includes(diff));
  const removedIds = new Set(removed.map((diff) => diff.id));
  await diffApi.bulkReplaceDiffResult(keep);
  const notes = await noteApi.listReviewNote();
  await noteApi.bulkReplaceReviewNote(notes.filter((note) => !removedIds.has(note.diff_result_id)));
}
