import type { PolicySection } from "../types/PolicySection";
import { readTable, writeTable } from "../utils/storage";

const tableKey = "policySection" as const;

export async function listPolicySection(): Promise<PolicySection[]> {
  return readTable<PolicySection>(tableKey);
}

export async function saveAllPolicySection(rows: PolicySection[]): Promise<PolicySection[]> {
  writeTable(tableKey, rows);
  return rows;
}

export async function createPolicySection(payload: PolicySection): Promise<PolicySection> {
  const rows = await listPolicySection();
  rows.push(payload);
  await saveAllPolicySection(rows);
  return payload;
}

export async function bulkCreatePolicySection(payloads: PolicySection[]): Promise<PolicySection[]> {
  const rows = await listPolicySection();
  rows.push(...payloads);
  await saveAllPolicySection(rows);
  return payloads;
}

export async function updatePolicySection(payload: PolicySection): Promise<PolicySection> {
  const rows = await listPolicySection();
  const index = rows.findIndex((row) => row.id === payload.id);
  if (index >= 0) {
    rows[index] = payload;
    await saveAllPolicySection(rows);
  }
  return payload;
}

export async function deletePolicySectionByDocument(documentId: number): Promise<void> {
  const rows = (await listPolicySection()).filter((row) => row.document_id !== documentId);
  await saveAllPolicySection(rows);
}
