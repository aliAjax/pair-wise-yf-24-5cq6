import type { ReviewNote } from "../types/ReviewNote";
import { readTable, writeTable } from "../utils/storage";

const tableKey = "reviewNote" as const;

export async function listReviewNote(): Promise<ReviewNote[]> {
  return readTable<ReviewNote>(tableKey);
}

export async function saveAllReviewNote(rows: ReviewNote[]): Promise<ReviewNote[]> {
  writeTable(tableKey, rows);
  return rows;
}

export async function createReviewNote(payload: ReviewNote): Promise<ReviewNote> {
  const rows = await listReviewNote();
  rows.push(payload);
  await saveAllReviewNote(rows);
  return payload;
}

export async function updateReviewNote(payload: ReviewNote): Promise<ReviewNote> {
  const rows = await listReviewNote();
  const index = rows.findIndex((row) => row.id === payload.id);
  if (index >= 0) {
    rows[index] = payload;
    await saveAllReviewNote(rows);
  }
  return payload;
}

export async function deleteReviewNote(id: number): Promise<void> {
  const rows = (await listReviewNote()).filter((row) => row.id !== id);
  await saveAllReviewNote(rows);
}

export async function bulkReplaceReviewNote(rows: ReviewNote[]): Promise<ReviewNote[]> {
  return saveAllReviewNote(rows);
}
