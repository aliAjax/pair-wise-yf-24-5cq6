import * as noteApi from "../api/ReviewNote";
import type { ReviewNote } from "../types/ReviewNote";
import type { ReviewStatus } from "../types/ReviewStatus";
import { AppError, ERROR_CODES } from "../utils/appError";
import { recordLog } from "../utils/logger";
import { getNextIds, saveNextIds } from "./policyDocumentService";

export async function listNotesByDiff(diffId: number): Promise<ReviewNote[]> {
  const all = await noteApi.listReviewNote();
  return all
    .filter((note) => note.diff_result_id === diffId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function addReviewNote(input: {
  diff_result_id: number;
  tag: string;
  comment: string;
  reviewer: string;
}): Promise<ReviewNote> {
  if (!input.comment.trim()) throw new AppError(ERROR_CODES.VALIDATION_FAILED);
  const ids = getNextIds();
  const now = new Date().toISOString();
  const note: ReviewNote = {
    id: ids.note,
    diff_result_id: input.diff_result_id,
    tag: input.tag,
    comment: input.comment.trim(),
    reviewer: input.reviewer.trim() || "未署名",
    status: "OPEN",
    inherited_from_note_id: null,
    created_at: now,
    updated_at: now
  };
  await noteApi.createReviewNote(note);
  saveNextIds({ ...ids, note: ids.note + 1 });
  recordLog("ReviewNote", "create", { id: note.id, diffResultId: note.diff_result_id, tag: note.tag });
  return note;
}

export async function updateReviewNote(
  noteId: number,
  patch: { tag?: string; comment?: string; status?: ReviewStatus }
): Promise<ReviewNote> {
  const all = await noteApi.listReviewNote();
  const target = all.find((note) => note.id === noteId);
  if (!target) throw new AppError(ERROR_CODES.RECORD_NOT_FOUND, { entity: "ReviewNote", id: noteId });
  const fields = Object.keys(patch);
  if (patch.tag !== undefined) target.tag = patch.tag;
  if (patch.comment !== undefined) target.comment = patch.comment;
  if (patch.status !== undefined) {
    recordLog("ReviewNote", "statusChange", { id: noteId, from: target.status, to: patch.status });
    target.status = patch.status;
  }
  target.updated_at = new Date().toISOString();
  await noteApi.updateReviewNote(target);
  recordLog("ReviewNote", "update", { id: noteId, fields: fields.join(",") || "无" });
  return target;
}

export async function deleteReviewNote(noteId: number): Promise<void> {
  await noteApi.deleteReviewNote(noteId);
  recordLog("ReviewNote", "update", { id: noteId, fields: "删除" });
}
