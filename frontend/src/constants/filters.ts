import type { DiffType } from "../types/DiffType";
import type { ReviewStatus } from "../types/ReviewStatus";

/** 版本对比页差异类型过滤选项，顺序即筛选器展示顺序 */
export const DIFF_FILTER_TYPES: DiffType[] = ["ADDED", "REMOVED", "MODIFIED", "MOVED", "UNCHANGED"];

/** 默认对比结果中折叠“未变化”，法务只关注有变化的条款 */
export const DEFAULT_DIFF_FILTER: DiffType[] = ["ADDED", "REMOVED", "MODIFIED", "MOVED"];

/** 审阅清单状态过滤选项 */
export const REVIEW_STATUS_FILTERS: ReviewStatus[] = ["OPEN", "CONFIRMED", "IGNORED", "RESOLVED"];
