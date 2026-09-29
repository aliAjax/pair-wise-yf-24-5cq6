import type { ReviewNote } from "../types/ReviewNote";
import type { ReviewStatus } from "../types/ReviewStatus";

export const createDefaultReviewNote = (overrides: Partial<ReviewNote> = {}): ReviewNote => ({
  id: 0,
  diff_result_id: 0,
  tag: "",
  comment: "",
  reviewer: "",
  status: "OPEN",
  updated_at: "",
  reopened: false,
  ...overrides
});

/** 审阅备注表单对象 */
export const createReviewNoteForm = (
  diffResultId: number,
  reviewer = ""
): Pick<ReviewNote, "diff_result_id" | "tag" | "comment" | "reviewer"> => ({
  diff_result_id: diffResultId,
  tag: "",
  comment: "",
  reviewer
});

export const buildReviewNote = (
  id: number,
  form: Pick<ReviewNote, "diff_result_id" | "tag" | "comment" | "reviewer">,
  status: ReviewStatus,
  updatedAt = new Date().toISOString()
): ReviewNote =>
  createDefaultReviewNote({
    id,
    ...form,
    status,
    updated_at: updatedAt
  });

export const createReviewNoteResponse = createDefaultReviewNote;
