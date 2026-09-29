import * as documentApi from "../api/PolicyDocument";
import * as sectionApi from "../api/PolicySection";
import type { PolicyDocument } from "../types/PolicyDocument";
import type { PolicySection } from "../types/PolicySection";
import { AppError, ERROR_CODES } from "../utils/appError";
import { recordLog } from "../utils/logger";
import { draftToSections, parsePolicyText } from "../utils/policyParser";
import { readMeta, writeMeta } from "../utils/storage";

const nextIdKey = "next-ids";

interface NextIds {
  document: number;
  section: number;
  diff: number;
  note: number;
}

export function getNextIds(): NextIds {
  return readMeta<NextIds>(nextIdKey, { document: 1, section: 1, diff: 1, note: 1 });
}

export function saveNextIds(ids: NextIds): void {
  writeMeta(nextIdKey, ids);
}

/** 导入政策：校验 -> 解析分段 -> 自动风险标注 -> 落库，返回文档与条款 */
export async function importPolicyDocument(input: {
  title: string;
  version_label: string;
  raw_text: string;
}): Promise<{ document: PolicyDocument; sections: PolicySection[] }> {
  const raw = input.raw_text.trim();
  if (!raw) throw new AppError(ERROR_CODES.DOCUMENT_EMPTY);
  if (!input.version_label.trim()) throw new AppError(ERROR_CODES.VALIDATION_FAILED);

  const existing = await documentApi.listPolicyDocument();
  if (existing.some((doc) => doc.version_label === input.version_label.trim())) {
    throw new AppError(ERROR_CODES.DOCUMENT_VERSION_DUPLICATED, { version: input.version_label });
  }

  const drafts = parsePolicyText(raw);
  if (drafts.length === 0) throw new AppError(ERROR_CODES.SECTION_PARSE_EMPTY);

  const ids = getNextIds();
  const now = new Date().toISOString();
  const document: PolicyDocument = {
    id: ids.document,
    title: input.title.trim() || `隐私政策 ${input.version_label.trim()}`,
    version_label: input.version_label.trim(),
    raw_text: raw,
    normalized_sections: drafts.length,
    imported_at: now
  };

  const { sections, nextId } = draftToSections(drafts, document.id, ids.section);

  // 与上一版（导入时间最近的文档）比较，标出本版新增条款
  const previous = [...existing].sort((a, b) => b.imported_at.localeCompare(a.imported_at))[0];
  if (previous) {
    const prevSections = (await sectionApi.listPolicySection()).filter((s) => s.document_id === previous.id);
    const prevKeys = new Set(prevSections.map((s) => `${s.section_no}|${s.heading}`));
    sections.forEach((section) => {
      if (!prevKeys.has(`${section.section_no}|${section.heading}`)) section.is_newly_added = true;
    });
  }

  await documentApi.createPolicyDocument(document);
  await sectionApi.bulkCreatePolicySection(sections);
  saveNextIds({ ...ids, document: ids.document + 1, section: nextId });

  recordLog("PolicyDocument", "create", { id: document.id, title: document.title, version: document.version_label });
  recordLog("PolicyDocument", "import", { id: document.id, sectionCount: sections.length });
  return { document, sections };
}

export async function updatePolicyDocumentMeta(id: number, patch: Pick<PolicyDocument, "title" | "version_label">): Promise<void> {
  const all = await documentApi.listPolicyDocument();
  const target = all.find((doc) => doc.id === id);
  if (!target) throw new AppError(ERROR_CODES.RECORD_NOT_FOUND, { entity: "PolicyDocument", id });
  const fields = Object.keys(patch).filter((key) => (target as unknown as Record<string, string>)[key] !== patch[key as keyof typeof patch]);
  Object.assign(target, patch);
  await documentApi.updatePolicyDocument(target);
  recordLog("PolicyDocument", "update", { id, fields: fields.join(",") || "无" });
}

export async function deletePolicyDocument(id: number): Promise<void> {
  await documentApi.deletePolicyDocument(id);
  await sectionApi.deletePolicySectionByDocument(id);
  recordLog("PolicyDocument", "delete", { id });
}
