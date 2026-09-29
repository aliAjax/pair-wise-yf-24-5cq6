import * as sectionApi from "../api/PolicySection";
import type { PolicySection } from "../types/PolicySection";
import type { PrivacyRiskLevel } from "../types/PrivacyRiskLevel";
import type { SectionCategory } from "../types/SectionCategory";
import { AppError, ERROR_CODES } from "../utils/appError";
import { recordLog } from "../utils/logger";

/** 风险标注页：法务手工覆盖自动判定的类别/风险等级 */
export async function annotateSection(
  sectionId: number,
  patch: { category?: SectionCategory; risk_level?: PrivacyRiskLevel }
): Promise<PolicySection> {
  const all = await sectionApi.listPolicySection();
  const target = all.find((section) => section.id === sectionId);
  if (!target) throw new AppError(ERROR_CODES.RECORD_NOT_FOUND, { entity: "PolicySection", id: sectionId });

  const fields: string[] = [];
  if (patch.category && patch.category !== target.category) {
    target.category = patch.category;
    fields.push("category");
  }
  if (patch.risk_level && patch.risk_level !== target.risk_level) {
    target.risk_level = patch.risk_level;
    fields.push("risk_level");
  }
  await sectionApi.updatePolicySection(target);
  recordLog("PolicySection", "riskOverride", {
    id: sectionId,
    category: target.category,
    riskLevel: target.risk_level
  });
  recordLog("PolicySection", "update", { id: sectionId, fields: fields.join(",") || "无" });
  return target;
}

export async function listSectionsByDocument(documentId: number): Promise<PolicySection[]> {
  const all = await sectionApi.listPolicySection();
  return all.filter((section) => section.document_id === documentId);
}
