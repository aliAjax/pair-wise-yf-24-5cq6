import { DiffTypeValues, type DiffType as DiffTypeT } from "../types/DiffType";

/** DiffType 常量：与 types/DiffType 重复定义，store/构造器/日志/筛选/展示均引用本处 */
export const DiffType = DiffTypeValues;
export type DiffType = DiffTypeT;
export const DiffTypeText: Record<DiffType, string> = {
  ADDED: "新增",
  REMOVED: "移除",
  MODIFIED: "改动",
  MOVED: "移动",
  UNCHANGED: "未变化"
};
