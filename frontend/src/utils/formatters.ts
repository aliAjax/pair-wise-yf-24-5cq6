import { STATUS_TEXT } from "../constants/statusText";

export const FORMAT_UNKNOWN = "-";

export const formatDate = (value: string | undefined | null): string => {
  if (!value) return FORMAT_UNKNOWN;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? FORMAT_UNKNOWN : date.toLocaleString("zh-CN", { hour12: false });
};

export const formatNumber = (value: number): string => new Intl.NumberFormat("zh-CN").format(value);

/** 兼容历史调用的通用状态格式化 */
export const formatStatus = (value: string): string => value.replace(/_/g, " ");

export const formatDiffType = (value: string): string =>
  STATUS_TEXT.DiffType[value as keyof typeof STATUS_TEXT.DiffType] ?? value;

export const formatRisk = (value: string): string =>
  STATUS_TEXT.PrivacyRiskLevel[value as keyof typeof STATUS_TEXT.PrivacyRiskLevel] ?? value;

export const formatReviewStatus = (value: string): string =>
  STATUS_TEXT.ReviewStatus[value as keyof typeof STATUS_TEXT.ReviewStatus] ?? value;

export const formatCategory = (value: string): string =>
  STATUS_TEXT.SectionCategory[value as keyof typeof STATUS_TEXT.SectionCategory] ?? value;

/** 文本差异行种类转中文标记，DiffViewer 与 Markdown 导出复用时使用 */
export const formatDiffLineKind = (kind: string): string =>
  ({ ADDED_LINE: "新增行", REMOVED_LINE: "删除行", CONTEXT: "上下文" }[kind] ?? kind);
