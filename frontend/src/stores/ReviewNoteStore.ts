import { defineStore } from "pinia";
import {
  clearReopenedByDiffs,
  createReviewNote,
  listReviewNote,
  updateReviewNote,
  updateReviewNoteStatus
} from "../api/ReviewNote";
import type { ReviewNote } from "../types/ReviewNote";
import type { ReviewStatus } from "../types/ReviewStatus";
import { buildReviewNote } from "../constructors/ReviewNoteConstructor";
import { ERROR_CODES } from "../constants/errorCodes";
import { PolicyDiffError } from "../utils/errors";
import { STATUS_TEXT } from "../constants/statusText";
import { logAction } from "../utils/logger";

export interface ReviewNoteInput {
  diffResultId: number;
  tag: string;
  comment: string;
  reviewer: string;
  status: ReviewStatus;
}

export const useReviewNoteStore = defineStore("reviewNote", {
  state: () => ({ rows: [] as ReviewNote[], loading: false }),
  getters: {
    notesByDiff: (state) => (diffResultId: number) =>
      state.rows
        .filter((row) => row.diff_result_id === diffResultId)
        .sort((a, b) => a.updated_at.localeCompare(b.updated_at)),
    latestByDiff: (state) => {
      const map = new Map<number, ReviewNote>();
      [...state.rows]
        .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
        .forEach((note) => map.set(note.diff_result_id, note));
      return map;
    },
    openCount: (state) => state.rows.filter((row) => row.status === "OPEN").length
  },
  actions: {
    async load() {
      this.loading = true;
      try {
        this.rows = await listReviewNote();
      } finally {
        this.loading = false;
      }
    },
    async addNote(input: ReviewNoteInput): Promise<ReviewNote> {
      if (!input.reviewer.trim()) {
        throw new PolicyDiffError(ERROR_CODES.REVIEWER_REQUIRED);
      }
      const form = {
        diff_result_id: input.diffResultId,
        tag: input.tag.trim(),
        comment: input.comment.trim(),
        reviewer: input.reviewer.trim()
      };
      const note = await createReviewNote(buildReviewNote(0, form, input.status));
      // 新的审阅意见代表已按最新内容处理，清除该条款历史结论的“被退回”标记
      await clearReopenedByDiffs([note.diff_result_id]);
      this.rows = this.rows.map((row) =>
        row.diff_result_id === note.diff_result_id ? { ...row, reopened: false } : row
      );
      this.rows.push(note);
      logAction("ReviewNote", "CREATE", { id: note.id, diffResultId: note.diff_result_id, reviewer: note.reviewer });
      return note;
    },
    async editNote(id: number, patch: Partial<Pick<ReviewNote, "tag" | "comment" | "reviewer">>) {
      const current = this.rows.find((row) => row.id === id);
      if (!current) return null;
      if (patch.reviewer !== undefined && !patch.reviewer.trim()) {
        throw new PolicyDiffError(ERROR_CODES.REVIEWER_REQUIRED);
      }
      const updated = await updateReviewNote({ ...current, ...patch });
      const index = this.rows.findIndex((row) => row.id === id);
      if (index >= 0) this.rows[index] = updated;
      logAction("ReviewNote", "UPDATE", { id, reviewer: updated.reviewer });
      return updated;
    },
    async setStatus(id: number, status: ReviewStatus) {
      const current = this.rows.find((row) => row.id === id);
      if (!current) return null;
      const fromStatus = STATUS_TEXT.ReviewStatus[current.status];
      const updated = await updateReviewNoteStatus(id, status);
      if (updated) {
        const index = this.rows.findIndex((row) => row.id === id);
        if (index >= 0) this.rows[index] = updated;
        logAction("ReviewNote", "STATUS_CHANGE", {
          id,
          fromStatus,
          toStatus: STATUS_TEXT.ReviewStatus[status]
        });
      }
      return updated;
    }
  }
});
