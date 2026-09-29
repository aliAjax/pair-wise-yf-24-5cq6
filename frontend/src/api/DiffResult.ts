import type { DiffResult } from "../types/DiffResult";
import { readTable, writeTable } from "../utils/storage";

const tableKey = "diffResult" as const;

export async function listDiffResult(): Promise<DiffResult[]> {
  return readTable<DiffResult>(tableKey);
}

export async function saveAllDiffResult(rows: DiffResult[]): Promise<DiffResult[]> {
  writeTable(tableKey, rows);
  return rows;
}

export async function updateDiffResult(payload: DiffResult): Promise<DiffResult> {
  const rows = await listDiffResult();
  const index = rows.findIndex((row) => row.id === payload.id);
  if (index >= 0) {
    rows[index] = payload;
    await saveAllDiffResult(rows);
  }
  return payload;
}

export async function bulkReplaceDiffResult(rows: DiffResult[]): Promise<DiffResult[]> {
  return saveAllDiffResult(rows);
}
