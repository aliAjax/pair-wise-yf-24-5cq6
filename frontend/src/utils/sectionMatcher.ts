import type { PolicySection } from "../types/PolicySection";
import type { DiffType } from "../types/DiffType";

/** 归一化用于比较：去除空白与全半角差异，仅保留正文语义字符 */
export function normalizeContent(content: string): string {
  return content
    .replace(/\s+/g, "")
    .replace(/[；;。.!！?？]$/, "")
    .replace(/[“”"'']/g, '"');
}

export interface SectionMatch {
  oldSection: PolicySection | null;
  newSection: PolicySection | null;
  diffType: DiffType;
}

const noToKey = (no: string): string => no.replace(/[.．、）)]/g, "").trim();

/**
 * 条款配对（两遍对齐，兼容插入条款后的整体重新编号）：
 * 1. 编号相同且标题一致 => 同一条款（内容相同 UNCHANGED，否则 MODIFIED）
 * 2. 标题一致（编号可能变）=> MOVED（内容也变则 MODIFIED，法务需按改动重审）
 * 3. 只剩编号相同 => 视为该编号位置上的 MODIFIED
 * 4. 始终无法配对 => ADDED / REMOVED
 */
export function matchSections(oldSections: PolicySection[], newSections: PolicySection[]): SectionMatch[] {
  const oldByNo = new Map(oldSections.map((s) => [noToKey(s.section_no), s]));
  const newByNo = new Map(newSections.map((s) => [noToKey(s.section_no), s]));
  const oldByHeading = new Map<string, PolicySection[]>();
  oldSections.forEach((s) => {
    const key = normalizeContent(s.heading);
    if (key) oldByHeading.set(key, [...(oldByHeading.get(key) ?? []), s]);
  });

  const matchedOldIds = new Set<number>();
  const matchedNewIds = new Set<number>();
  const results: SectionMatch[] = [];

  const push = (oldSection: PolicySection | null, newSection: PolicySection | null, diffType: DiffType) => {
    if (oldSection) matchedOldIds.add(oldSection.id);
    if (newSection) matchedNewIds.add(newSection.id);
    results.push({ oldSection, newSection, diffType });
  };

  // 第一遍：编号 + 标题双重一致
  newSections.forEach((next) => {
    const byNo = oldByNo.get(noToKey(next.section_no));
    if (byNo && normalizeContent(byNo.heading) === normalizeContent(next.heading)) {
      const same = normalizeContent(byNo.content) === normalizeContent(next.content);
      push(byNo, next, same ? "UNCHANGED" : "MODIFIED");
    }
  });

  // 第二遍：标题一致（条款插入后编号顺延）
  newSections.forEach((next) => {
    if (matchedNewIds.has(next.id)) return;
    const candidates = oldByHeading.get(normalizeContent(next.heading)) ?? [];
    const byHeading = candidates.find((candidate) => !matchedOldIds.has(candidate.id));
    if (byHeading) {
      const same = normalizeContent(byHeading.content) === normalizeContent(next.content);
      push(byHeading, next, same ? "MOVED" : "MODIFIED");
    }
  });

  // 第三遍：编号一致但标题变了，按编号位置改动处理
  newSections.forEach((next) => {
    if (matchedNewIds.has(next.id)) return;
    const byNo = oldByNo.get(noToKey(next.section_no));
    if (byNo && !matchedOldIds.has(byNo.id)) {
      push(byNo, next, "MODIFIED");
    }
  });

  // 第四遍：新增 / 移除
  newSections.forEach((next) => {
    if (!matchedNewIds.has(next.id)) push(null, next, "ADDED");
  });
  oldSections.forEach((prev) => {
    if (!matchedOldIds.has(prev.id)) push(prev, null, "REMOVED");
  });

  const order: Record<DiffType, number> = { ADDED: 0, MODIFIED: 1, REMOVED: 2, MOVED: 3, UNCHANGED: 4 };
  return results.sort((a, b) => {
    const noA = (a.newSection ?? a.oldSection)?.section_no ?? "";
    const noB = (b.newSection ?? b.oldSection)?.section_no ?? "";
    if (noA === noB) return order[a.diffType] - order[b.diffType];
    return noA.localeCompare(noB, "zh-CN", { numeric: true });
  });
}
