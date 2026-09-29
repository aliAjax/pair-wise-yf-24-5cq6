import type { ReviewNote } from "../types/ReviewNote";

/** 审阅备注构造器 */
export const createDefaultReviewNote = (overrides: Partial<ReviewNote> = {}): ReviewNote => ({
  id: 0,
  diff_result_id: 0,
  tag: "存疑",
  comment: "",
  reviewer: "",
  status: "OPEN",
  inherited_from_note_id: null,
  created_at: "",
  updated_at: "",
  ...overrides
});

export const createReviewNoteForm = (): Partial<ReviewNote> => ({
  tag: "存疑",
  comment: "",
  reviewer: ""
});

export const createReviewNoteResponse = (overrides: Partial<ReviewNote> = {}): ReviewNote =>
  createDefaultReviewNote(overrides);
