import * as diffApi from "../api/DiffResult";
import * as documentApi from "../api/PolicyDocument";
import * as noteApi from "../api/ReviewNote";
import { DiffTypeText } from "../constants/DiffType";
import { PrivacyRiskLevelText } from "../constants/PrivacyRiskLevel";
import { ReviewStatusText } from "../constants/ReviewStatus";
import { formatDate } from "../utils/formatters";
import { recordLog } from "../utils/logger";
import type { DiffType } from "../types/DiffType";

/** 导出当前版本对的 Markdown 审阅摘要（审阅清单页使用） */
export async function exportReviewMarkdown(oldDocumentId: number, newDocumentId: number): Promise<string> {
  const [documents, diffs, notes] = await Promise.all([
    documentApi.listPolicyDocument(),
    diffApi.listDiffResult(),
    noteApi.listReviewNote()
  ]);
  const oldDoc = documents.find((doc) => doc.id === oldDocumentId);
  const newDoc = documents.find((doc) => doc.id === newDocumentId);
  const pairDiffs = diffs.filter((diff) => diff.old_document_id === oldDocumentId && diff.new_document_id === newDocumentId);
  const order: DiffType[] = ["ADDED", "MODIFIED", "REMOVED", "MOVED", "UNCHANGED"];
  const sorted = [...pairDiffs].sort(
    (a, b) => order.indexOf(a.diff_type) - order.indexOf(b.diff_type) || a.section_no.localeCompare(b.section_no, "zh-CN", { numeric: true })
  );

  const lines: string[] = [];
  lines.push(`# 隐私政策版本审阅摘要`);
  lines.push("");
  lines.push(`- 旧版本：${oldDoc?.title ?? oldDocumentId}（${oldDoc?.version_label ?? "—"}）`);
  lines.push(`- 新版本：${newDoc?.title ?? newDocumentId}（${newDoc?.version_label ?? "—"}）`);
  lines.push(`- 导出时间：${formatDate(new Date().toISOString())}`);
  const openCount = pairDiffs.filter((diff) => diff.status === "OPEN").length;
  lines.push(`- 待处理：${openCount} / ${pairDiffs.length}`);
  lines.push("");

  sorted.forEach((diff) => {
    lines.push(`## [${DiffTypeText[diff.diff_type]}] ${diff.section_no} ${diff.heading}`);
    lines.push("");
    lines.push(`- 风险等级：${PrivacyRiskLevelText[diff.risk_level]}`);
    lines.push(`- 审阅状态：${ReviewStatusText[diff.status]}${diff.reviewer ? `（${diff.reviewer} ${diff.reviewed_at ? formatDate(diff.reviewed_at) : ""}）` : ""}`);
    lines.push(`- 说明：${diff.summary}`);
    const diffNotes = notes.filter((note) => note.diff_result_id === diff.id);
    if (diffNotes.length > 0) {
      lines.push("- 审阅备注：");
      diffNotes.forEach((note) => {
        const inherited = note.inherited_from_note_id !== null ? "（沿用上一版备注）" : "";
        lines.push(`  - [${note.tag}]${inherited} ${note.comment} —— ${note.reviewer}`);
      });
    }
    lines.push("");
  });

  const markdown = lines.join("\n");
  recordLog("DiffResult", "export", { oldDocId: oldDocumentId, newDocId: newDocumentId, count: pairDiffs.length });
  recordLog("ReviewNote", "export", { diffResultId: pairDiffs[0]?.id ?? 0, count: notes.length });
  return markdown;
}

export function downloadMarkdown(filename: string, markdown: string): void {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
