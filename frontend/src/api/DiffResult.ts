import type { DiffResult } from "../types/DiffResult";
import { nextId, readRows, writeRows } from "./localStorage";

const TABLE = "diffResult" as const;

export async function listDiffResult(): Promise<DiffResult[]> {
  return readRows<DiffResult>(TABLE);
}

export async function listDiffResultByPair(oldDocumentId: number, newDocumentId: number): Promise<DiffResult[]> {
  return readRows<DiffResult>(TABLE).filter(
    (row) => row.old_document_id === oldDocumentId && row.new_document_id === newDocumentId
  );
}

/** 重新对比时整体替换该版本对的差异结果，旧结果被清空 */
export async function replaceDiffResultForPair(
  oldDocumentId: number,
  newDocumentId: number,
  payload: DiffResult[]
): Promise<DiffResult[]> {
  const rows = readRows<DiffResult>(TABLE).filter(
    (row) => !(row.old_document_id === oldDocumentId && row.new_document_id === newDocumentId)
  );
  let id = nextId(rows);
  const created = payload.map((row) => ({ ...row, id: id++ }));
  rows.push(...created);
  writeRows(TABLE, rows);
  return created;
}

export async function updateDiffResult(payload: DiffResult): Promise<DiffResult> {
  const rows = readRows<DiffResult>(TABLE);
  const index = rows.findIndex((row) => row.id === payload.id);
  if (index < 0) return payload;
  rows[index] = { ...rows[index], ...payload };
  writeRows(TABLE, rows);
  return rows[index];
}

/** 删除某文档参与的全部差异（文档删除时联动） */
export async function deleteDiffResultByDocument(documentId: number): Promise<void> {
  writeRows(
    TABLE,
    readRows<DiffResult>(TABLE).filter(
      (row) => row.old_document_id !== documentId && row.new_document_id !== documentId
    )
  );
}

export async function saveDiffResult(payload: DiffResult): Promise<DiffResult> {
  return updateDiffResult(payload);
}
