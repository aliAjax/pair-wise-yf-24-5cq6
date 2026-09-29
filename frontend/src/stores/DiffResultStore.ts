import { defineStore } from "pinia";
import {
  listDiffResult,
  replaceDiffResultForPair
} from "../api/DiffResult";
import { listPolicySection } from "../api/PolicySection";
import { listPolicyDocument } from "../api/PolicyDocument";
import { listReviewNote, patchReviewNotes } from "../api/ReviewNote";
import type { DiffResult } from "../types/DiffResult";
import type { PolicySection } from "../types/PolicySection";
import { buildDiffResults, reconcileReviewState, type ReopenOutcome } from "../services/diffEngine";
import { ERROR_CODES } from "../constants/errorCodes";
import { PolicyDiffError } from "../utils/errors";
import { STATUS_TEXT } from "../constants/statusText";
import { logAction } from "../utils/logger";

export interface CompareOutcome {
  diffs: DiffResult[];
  reopened: ReopenOutcome;
}

export const useDiffResultStore = defineStore("diffResult", {
  state: () => ({
    rows: [] as DiffResult[],
    loading: false,
    comparing: false,
    /** 最近一次对比的版本对 */
    currentPair: { oldDocumentId: null as number | null, newDocumentId: null as number | null }
  }),
  getters: {
    diffsByPair: (state) => (oldDocumentId: number, newDocumentId: number) =>
      state.rows.filter(
        (row) => row.old_document_id === oldDocumentId && row.new_document_id === newDocumentId
      ),
    countByType: (state) => (type: DiffResult["diff_type"]) =>
      state.rows.filter((row) => row.diff_type === type).length
  },
  actions: {
    async load() {
      this.loading = true;
      try {
        this.rows = await listDiffResult();
      } finally {
        this.loading = false;
      }
    },
    /**
     * 对比两版政策：
     * 1) 按条款 match_key 对齐，列出新增 / 移除 / 改动；
     * 2) 新条款按分类规则标出风险；
     * 3) 已确认但条款内容又变过的结论退回待处理，历史备注文字保留。
     */
    async compare(oldDocumentId: number, newDocumentId: number): Promise<CompareOutcome> {
      if (oldDocumentId === newDocumentId) {
        throw new PolicyDiffError(ERROR_CODES.SAME_VERSION_COMPARE);
      }
      this.comparing = true;
      try {
        const [documents, sections, historicalDiffs, notes] = await Promise.all([
          listPolicyDocument(),
          listPolicySection(),
          listDiffResult(),
          listReviewNote()
        ]);
        const oldDocument = documents.find((doc) => doc.id === oldDocumentId);
        const newDocument = documents.find((doc) => doc.id === newDocumentId);
        if (!oldDocument || !newDocument) {
          throw new PolicyDiffError(ERROR_CODES.DOCUMENT_NOT_FOUND);
        }
        const oldSections: PolicySection[] = sections.filter((row) => row.document_id === oldDocumentId);
        const newSections: PolicySection[] = sections.filter((row) => row.document_id === newDocumentId);

        // replaceDiffResultForPair 会先删除当前版本对的旧差异，因此对账时要把它们
        // 与其它版本对（如更早的 v1→v2）的历史差异一起纳入，实现确认记录跨版本跟随
        const drafts = buildDiffResults(oldDocument, newDocument, oldSections, newSections);
        const saved = await replaceDiffResultForPair(oldDocumentId, newDocumentId, drafts);

        const { patches, outcome } = reconcileReviewState(historicalDiffs, saved, notes);
        await patchReviewNotes(patches);

        this.rows = await listDiffResult();
        this.currentPair = { oldDocumentId, newDocumentId };

        logAction("DiffResult", "CREATE", {
          oldLabel: oldDocument.version_label,
          newLabel: newDocument.version_label,
          diffCount: saved.length
        });
        if (outcome.reopenedNoteIds.length > 0) {
          logAction("DiffResult", "REOPEN", {
            id: 0,
            matchKey: `${outcome.reopenedDiffIds.length} 个条款`,
            fromStatus: STATUS_TEXT.ReviewStatus.CONFIRMED,
            toStatus: STATUS_TEXT.ReviewStatus.OPEN
          });
        }
        return { diffs: saved, reopened: outcome };
      } finally {
        this.comparing = false;
      }
    },
    async ensureLoaded(): Promise<DiffResult[]> {
      if (this.rows.length === 0) await this.load();
      return this.rows;
    }
  }
});
