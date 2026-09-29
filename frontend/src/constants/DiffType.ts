import type { DiffType } from "../types/DiffType";

export const DIFF_TYPES: readonly DiffType[] = ["ADDED", "REMOVED", "MODIFIED", "MOVED", "UNCHANGED"];

export const DIFF_TYPE_TEXT: Record<DiffType, string> = {
  ADDED: "新增",
  REMOVED: "移除",
  MODIFIED: "改动",
  MOVED: "顺序调整",
  UNCHANGED: "未变化"
};

/** 对比页差异类型筛选器顺序 */
export const DIFF_TYPE_FILTERS: DiffType[] = ["ADDED", "REMOVED", "MODIFIED", "MOVED", "UNCHANGED"];
