import type { PolicyDocument } from "../types/PolicyDocument";
import { nextId, readRows, writeRows } from "./localStorage";

const TABLE = "policyDocument" as const;

export async function listPolicyDocument(): Promise<PolicyDocument[]> {
  return readRows<PolicyDocument>(TABLE);
}

export async function createPolicyDocument(payload: PolicyDocument): Promise<PolicyDocument> {
  const rows = readRows<PolicyDocument>(TABLE);
  const row: PolicyDocument = { ...payload, id: nextId(rows) };
  rows.push(row);
  writeRows(TABLE, rows);
  return row;
}

export async function updatePolicyDocument(payload: PolicyDocument): Promise<PolicyDocument> {
  const rows = readRows<PolicyDocument>(TABLE);
  const index = rows.findIndex((row) => row.id === payload.id);
  if (index < 0) return payload;
  rows[index] = { ...rows[index], ...payload };
  writeRows(TABLE, rows);
  return rows[index];
}

export async function deletePolicyDocument(id: number): Promise<void> {
  writeRows(
    TABLE,
    readRows<PolicyDocument>(TABLE).filter((row) => row.id !== id)
  );
}

/** 兼容旧调用的保存入口（存在即更新，否则新建） */
export async function savePolicyDocument(payload: PolicyDocument): Promise<PolicyDocument> {
  return payload.id ? updatePolicyDocument(payload) : createPolicyDocument(payload);
}
