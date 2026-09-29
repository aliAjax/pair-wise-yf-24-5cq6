import type { PolicyDocument } from "../types/PolicyDocument";
import type { PolicySection } from "../types/PolicySection";
import type { DiffResult } from "../types/DiffResult";
import type { DiffType } from "../types/DiffType";
import type { ReviewNote } from "../types/ReviewNote";
import type { PrivacyRiskLevel } from "../types/PrivacyRiskLevel";
import { NEW_SECTION_RISK_RULE } from "../constants/SectionCategory";
import { REVIEW_STATUS_REOPENED } from "../constants/ReviewStatus";
import { createDiffResultFromInput } from "../constructors/DiffResultConstructor";
import { summarizeDiff, diffText } from "../hooks/useTextDiff";

export interface DiffPair {
  oldSection: PolicySection | null;
  newSection: PolicySection | null;
  type: DiffType;
}

export interface ReopenOutcome {
  reopenedDiffIds: number[];
  reopenedNoteIds: number[];
}

/** 按 match_key 对齐两版条款，产出新增 / 移除 / 改动 / 未变化分类 */
export const alignSections = (
  oldSections: PolicySection[],
  newSections: PolicySection[]
): DiffPair[] => {
  const oldMap = new Map(oldSections.map((section) => [section.match_key, section]));
  const newMap = new Map(newSections.map((section) => [section.match_key, section]));
  const pairs: DiffPair[] = [];

  // 以新版顺序为主线遍历，保证“逐段列出变化”时顺序稳定
  newSections.forEach((next) => {
    const previous = oldMap.get(next.match_key) ?? null;
    if (!previous) {
      pairs.push({ oldSection: null, newSection: next, type: "ADDED" });
    } else if (previous.content_hash !== next.content_hash) {
      pairs.push({ oldSection: previous, newSection: next, type: "MODIFIED" });
    } else {
      pairs.push({ oldSection: previous, newSection: next, type: "UNCHANGED" });
    }
  });

  // 新版中不存在的旧条款 → 移除，保持旧版顺序
  oldSections.forEach((previous) => {
    if (!newMap.has(previous.match_key)) {
      pairs.push({ oldSection: previous, newSection: null, type: "REMOVED" });
    }
  });

  return pairs;
};

const buildSummary = (pair: DiffPair): string => {
  if (pair.type === "ADDED") {
    return `新增条款「${pair.newSection?.heading ?? ""}」`;
  }
  if (pair.type === "REMOVED") {
    return `移除条款「${pair.oldSection?.heading ?? ""}」`;
  }
  if (pair.type === "MODIFIED" && pair.oldSection && pair.newSection) {
    const stats = summarizeDiff(diffText(pair.oldSection.content, pair.newSection.content));
    return `条款「${pair.newSection.heading}」内容改动：新增 ${stats.addedLines} 行、删除 ${stats.removedLines} 行`;
  }
  return `条款「${pair.newSection?.heading ?? pair.oldSection?.heading ?? ""}」未变化`;
};

const resolveRisk = (pair: DiffPair): PrivacyRiskLevel => {
  if (pair.type === "ADDED" && pair.newSection) {
    // 新条款按数据收集 / 信息共享 / 保存期限规则标出风险高低
    return NEW_SECTION_RISK_RULE[pair.newSection.category];
  }
  if (pair.type === "REMOVED" && pair.oldSection) {
    // 移除涉及共享 / 收集的条款同样需要法务关注
    return pair.oldSection.category === "INFORMATION_SHARING" || pair.oldSection.category === "DATA_COLLECTION"
      ? "MEDIUM"
      : pair.oldSection.risk_level;
  }
  if (pair.type === "MODIFIED" && pair.newSection) {
    // 改动条款沿用两类风险中更高者，避免降级漏掉风险
    const order: PrivacyRiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const oldRisk = pair.oldSection?.risk_level ?? "LOW";
    const newRisk = pair.newSection.risk_level;
    return order.indexOf(newRisk) >= order.indexOf(oldRisk) ? newRisk : oldRisk;
  }
  return pair.newSection?.risk_level ?? "LOW";
};

let diffSequence = 0;

/**
 * 生成两版政策的差异结果。
 * id 采用负值临时序号，落库时由 API 层替换为真实自增 id。
 */
export const buildDiffResults = (
  oldDocument: PolicyDocument,
  newDocument: PolicyDocument,
  oldSections: PolicySection[],
  newSections: PolicySection[]
): DiffResult[] => {
  const pairs = alignSections(oldSections, newSections);
  return pairs
    .filter((pair) => pair.type !== "UNCHANGED")
    .map((pair) => {
      diffSequence -= 1;
      const targetSection = pair.newSection ?? pair.oldSection;
      return createDiffResultFromInput({
        id: diffSequence,
        oldDocumentId: pair.oldSection ? oldDocument.id : null,
        newDocumentId: pair.newSection ? newDocument.id : null,
        oldSectionId: pair.oldSection?.id ?? null,
        newSectionId: pair.newSection?.id ?? null,
        matchKey: targetSection?.match_key ?? "",
        diffType: pair.type,
        summary: buildSummary(pair),
        riskLevel: resolveRisk(pair),
        contentHash: pair.newSection?.content_hash ?? pair.oldSection?.content_hash ?? ""
      });
    });
};

export interface NotePatch {
  noteId: number;
  nextDiffId: number;
  status: ReviewNote["status"];
  reopened: boolean;
}

/**
 * 重新导入更新版政策并重新对比后，对历史审阅结论进行对账：
 *
 * - 备注按条款 match_key 跨版本跟随：v1→v2 确认后，导入 v3 对比 v2→v3，
 *   条款的新差异会接管旧备注，备注文字保留；
 * - 条款内容指纹相对“上次审阅时”又变过 → CONFIRMED / RESOLVED 退回 OPEN，
 *   旧结论不再当成新版本结论，并打 reopened 标记；
 * - 指纹未变 → 状态原样保留；
 * - 已挂在当前这批差异上的备注（同版本对重复对比）同样按内容变化判定退回。
 */
export const reconcileReviewState = (
  historicalDiffs: DiffResult[],
  currentDiffs: DiffResult[],
  notes: ReviewNote[]
): { patches: NotePatch[]; outcome: ReopenOutcome } => {
  // 每个条款只保留时间上最近的一条历史差异，作为“上次审阅结论”的锚点
  const latestByKey = new Map<string, DiffResult>();
  historicalDiffs
    .filter((diff) => diff.match_key)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .forEach((diff) => latestByKey.set(diff.match_key, diff));

  const currentByKey = new Map(currentDiffs.map((diff) => [diff.match_key, diff]));
  const patches: NotePatch[] = [];
  const outcome: ReopenOutcome = { reopenedDiffIds: [], reopenedNoteIds: [] };
  const settled: ReviewNote["status"][] = ["CONFIRMED", "RESOLVED"];

  notes.forEach((note) => {
    const anchored = historicalDiffs.find((diff) => diff.id === note.diff_result_id);
    if (!anchored) return;
    const current = currentByKey.get(anchored.match_key);
    if (!current) return; // 条款在这一版没有变化（UNCHANGED）或整条消失，备注继续挂在旧差异上

    const latestHistorical = latestByKey.get(anchored.match_key) ?? anchored;
    const changedHash = current.content_hash !== latestHistorical.content_hash;
    const shouldReopen = settled.includes(note.status) && changedHash;
    const needsMove = current.id !== note.diff_result_id;

    if (needsMove || shouldReopen) {
      patches.push({
        noteId: note.id,
        nextDiffId: current.id,
        status: shouldReopen ? REVIEW_STATUS_REOPENED : note.status,
        reopened: shouldReopen
      });
      if (shouldReopen) {
        outcome.reopenedDiffIds.push(current.id);
        outcome.reopenedNoteIds.push(note.id);
      }
    }
  });

  return { patches, outcome };
};
