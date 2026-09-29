import type { DiffType } from "../types/DiffType";
import type { PolicySection } from "../types/PolicySection";

/** 差异摘要：展示在对比卡片标题下，供审阅清单与 Markdown 导出复用 */
export function buildDiffSummary(
  diffType: DiffType,
  oldSection: PolicySection | null,
  newSection: PolicySection | null,
  addedChars = 0,
  removedChars = 0
): string {
  const no = (newSection ?? oldSection)?.section_no ?? "";
  switch (diffType) {
    case "ADDED":
      return `${no} 为本版新增条款，自动标注为「${newSection?.heading ?? ""}」，请评估风险`;
    case "REMOVED":
      return `${no} 在新版中被移除：${oldSection?.heading ?? ""}`;
    case "MOVED":
      return `${oldSection?.section_no ?? ""} 移动为 ${newSection?.section_no ?? ""}，内容未变化`;
    case "MODIFIED":
      return `${no} 内容发生改动（新增约 ${addedChars} 字、删除约 ${removedChars} 字），原确认结论已退回待处理`;
    case "UNCHANGED":
    default:
      return `${no} 条款内容未变化`;
  }
}
