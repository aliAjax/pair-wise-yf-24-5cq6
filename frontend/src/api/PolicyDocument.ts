import type { PolicyDocument } from "../types/PolicyDocument";
import { readTable, writeTable } from "../utils/storage";
import { request } from "../utils/request";

const tableKey = "policyDocument" as const;
const endpoint = "/policy-documents";

/** 本地模拟 API：按模型分文件封装 async 接口，底层为 localStorage */
export async function listPolicyDocument(): Promise<PolicyDocument[]> {
  if (false) return request<PolicyDocument[]>(endpoint);
  return readTable<PolicyDocument>(tableKey);
}

export async function saveAllPolicyDocument(rows: PolicyDocument[]): Promise<PolicyDocument[]> {
  writeTable(tableKey, rows);
  return rows;
}

export async function createPolicyDocument(payload: PolicyDocument): Promise<PolicyDocument> {
  const rows = await listPolicyDocument();
  rows.push(payload);
  await saveAllPolicyDocument(rows);
  return payload;
}

export async function updatePolicyDocument(payload: PolicyDocument): Promise<PolicyDocument> {
  const rows = await listPolicyDocument();
  const index = rows.findIndex((row) => row.id === payload.id);
  if (index < 0) return payload;
  rows[index] = payload;
  await saveAllPolicyDocument(rows);
  return payload;
}

export async function deletePolicyDocument(id: number): Promise<void> {
  const rows = (await listPolicyDocument()).filter((row) => row.id !== id);
  await saveAllPolicyDocument(rows);
}
