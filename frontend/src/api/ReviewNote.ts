import type { ReviewNote } from "../types/ReviewNote";
import type { ReviewStatus } from "../types/ReviewStatus";
import { nextId, readRows, writeRows } from "./localStorage";

const TABLE = "reviewNote" as const;

export async function listReviewNote(): Promise<ReviewNote[]> {
  return readRows<ReviewNote>(TABLE);
}

export async function listReviewNoteByDiff(diffResultId: number): Promise<ReviewNote[]> {
  return readRows<ReviewNote>(TABLE).filter((row) => row.diff_result_id === diffResultId);
}

export async function createReviewNote(payload: ReviewNote): Promise<ReviewNote> {
  const rows = readRows<ReviewNote>(TABLE);
  const row: ReviewNote = { ...payload, id: nextId(rows) };
  rows.push(row);
  writeRows(TABLE, rows);
  return row;
}

export async function updateReviewNote(payload: ReviewNote): Promise<ReviewNote> {
  const rows = readRows<ReviewNote>(TABLE);
  const index = rows.findIndex((row) => row.id === payload.id);
  if (index < 0) return payload;
  rows[index] = { ...rows[index], ...payload, updated_at: new Date().toISOString() };
  writeRows(TABLE, rows);
  return rows[index];
}

/** 差异重新生成后，按补丁迁移历史备注（保留评论文字），并按需退回确认状态 */
export async function patchReviewNotes(
  patches: { noteId: number; nextDiffId: number; status: ReviewStatus; reopened: boolean }[]
): Promise<ReviewNote[]> {
  if (patches.length === 0) return readRows<ReviewNote>(TABLE);
  const rows = readRows<ReviewNote>(TABLE);
  const patchMap = new Map(patches.map((patch) => [patch.noteId, patch]));
  rows.forEach((row) => {
    const patch = patchMap.get(row.id);
    if (patch) {
      row.diff_result_id = patch.nextDiffId;
      row.status = patch.status;
      row.reopened = patch.reopened;
      row.updated_at = new Date().toISOString();
    }
  });
  writeRows(TABLE, rows);
  return rows;
}

/** 差异被删除时移除挂空的备注（仅文档删除场景，重新对比走 remap 保留） */
export async function deleteReviewNoteByDiffIds(diffIds: number[]): Promise<void> {
  if (diffIds.length === 0) return;
  const removed = new Set(diffIds);
  writeRows(
    TABLE,
    readRows<ReviewNote>(TABLE).filter((row) => !removed.has(row.diff_result_id))
  );
}

export async function updateReviewNoteStatus(id: number, status: ReviewStatus): Promise<ReviewNote | null> {
  const rows = readRows<ReviewNote>(TABLE);
  const row = rows.find((item) => item.id === id);
  if (!row) return null;
  row.status = status;
  // 审查员重新给出结论后，清除“被退回”标记
  row.reopened = false;
  row.updated_at = new Date().toISOString();
  writeRows(TABLE, rows);
  return row;
}

/** 审查员对某条差异写下新意见后，清除该条款全部历史结论的“被退回”标记 */
export async function clearReopenedByDiffs(diffIds: number[]): Promise<void> {
  if (diffIds.length === 0) return;
  const targets = new Set(diffIds);
  const rows = readRows<ReviewNote>(TABLE);
  let touched = false;
  rows.forEach((row) => {
    if (row.reopened && targets.has(row.diff_result_id)) {
      row.reopened = false;
      touched = true;
    }
  });
  if (touched) writeRows(TABLE, rows);
}

export async function saveReviewNote(payload: ReviewNote): Promise<ReviewNote> {
  return payload.id ? updateReviewNote(payload) : createReviewNote(payload);
}
