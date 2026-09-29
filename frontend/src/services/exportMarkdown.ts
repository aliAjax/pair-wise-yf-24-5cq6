import type { DiffResult } from "../types/DiffResult";
import type { PolicyDocument } from "../types/PolicyDocument";
import type { PolicySection } from "../types/PolicySection";
import type { ReviewNote } from "../types/ReviewNote";
import { DIFF_TYPE_TEXT } from "../constants/DiffType";
import { RISK_LEVEL_TEXT } from "../constants/PrivacyRiskLevel";
import { REVIEW_STATUS_TEXT } from "../constants/ReviewStatus";
import { SECTION_CATEGORY_TEXT } from "../constants/SectionCategory";
import { formatDate } from "../utils/formatters";

export interface ExportBundle {
  oldDocument: PolicyDocument;
  newDocument: PolicyDocument;
  diffs: DiffResult[];
  notes: ReviewNote[];
  oldSections: PolicySection[];
  newSections: PolicySection[];
}

const escapeMd = (text: string): string => text.replace(/\|/g, "\\|").replace(/\n/g, " ");

/** 生成审阅 Markdown 摘要，审阅清单页“导出 Markdown”下载 */
export const buildReviewMarkdown = (bundle: ExportBundle): string => {
  const { oldDocument, newDocument, diffs, notes, oldSections, newSections } = bundle;
  const noteByDiff = new Map<number, ReviewNote[]>();
  notes.forEach((note) => {
    const list = noteByDiff.get(note.diff_result_id) ?? [];
    list.push(note);
    noteByDiff.set(note.diff_result_id, list);
  });

  const lines: string[] = [];
  lines.push(`# 隐私政策审阅摘要`);
  lines.push("");
  lines.push(`- 旧版本：${oldDocument.title}（${oldDocument.version_label}）`);
  lines.push(`- 新版本：${newDocument.title}（${newDocument.version_label}）`);
  lines.push(`- 导出时间：${formatDate(new Date().toISOString())}`);
  lines.push(`- 变化条款：${diffs.length} 条`);
  lines.push("");
  lines.push("## 逐条变化");
  lines.push("");
  lines.push("| 条款 | 变化 | 风险 | 分类 | 审阅状态 | 审阅人 | 备注 |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- |");

  diffs.forEach((diff) => {
    const section = newSections.find((item) => item.id === diff.new_section_id)
      ?? oldSections.find((item) => item.id === diff.old_section_id);
    const diffNotes = noteByDiff.get(diff.id) ?? [];
    const latest = diffNotes[diffNotes.length - 1];
    lines.push(
      [
        section ? escapeMd(`${section.section_no} ${section.heading}`) : diff.match_key,
        DIFF_TYPE_TEXT[diff.diff_type],
        RISK_LEVEL_TEXT[diff.risk_level],
        section ? SECTION_CATEGORY_TEXT[section.category] : "-",
        latest ? REVIEW_STATUS_TEXT[latest.status] : "待处理",
        latest ? escapeMd(latest.reviewer) : "-",
        latest ? escapeMd(latest.comment || "-") : "-"
      ].join(" | ")
    );
  });

  const openNotes = notes.filter((note) => note.status === "OPEN");
  if (openNotes.length > 0) {
    lines.push("");
    lines.push("## 待处理项");
    lines.push("");
    openNotes.forEach((note) => {
      lines.push(`- [ ] 差异 #${note.diff_result_id}：${escapeMd(note.comment || "（无备注）")} — ${note.reviewer}`);
    });
  }

  lines.push("");
  return lines.join("\n");
};

/** 触发浏览器下载 */
export const downloadMarkdown = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
