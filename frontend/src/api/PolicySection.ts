import type { PolicySection } from "../types/PolicySection";
import { nextId, readRows, writeRows } from "./localStorage";

const TABLE = "policySection" as const;

export async function listPolicySection(): Promise<PolicySection[]> {
  return readRows<PolicySection>(TABLE);
}

export async function listPolicySectionByDocument(documentId: number): Promise<PolicySection[]> {
  return readRows<PolicySection>(TABLE).filter((row) => row.document_id === documentId);
}

export async function bulkCreatePolicySection(payload: PolicySection[]): Promise<PolicySection[]> {
  const rows = readRows<PolicySection>(TABLE);
  let id = nextId(rows);
  const created = payload.map((row) => ({ ...row, id: id++ }));
  rows.push(...created);
  writeRows(TABLE, rows);
  return created;
}

export async function updatePolicySection(payload: PolicySection): Promise<PolicySection> {
  const rows = readRows<PolicySection>(TABLE);
  const index = rows.findIndex((row) => row.id === payload.id);
  if (index < 0) return payload;
  rows[index] = { ...rows[index], ...payload };
  writeRows(TABLE, rows);
  return rows[index];
}

export async function deletePolicySectionByDocument(documentId: number): Promise<void> {
  writeRows(
    TABLE,
    readRows<PolicySection>(TABLE).filter((row) => row.document_id !== documentId)
  );
}

export async function savePolicySection(payload: PolicySection): Promise<PolicySection> {
  return updatePolicySection(payload);
}
