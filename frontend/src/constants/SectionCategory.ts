import type { SectionCategory } from "../types/SectionCategory";
import type { PrivacyRiskLevel } from "../types/PrivacyRiskLevel";

export const SECTION_CATEGORIES: readonly SectionCategory[] = [
  "DATA_COLLECTION",
  "INFORMATION_SHARING",
  "RETENTION",
  "USER_RIGHTS",
  "CONTACT",
  "OTHER"
];

export const SECTION_CATEGORY_TEXT: Record<SectionCategory, string> = {
  DATA_COLLECTION: "数据收集",
  INFORMATION_SHARING: "信息共享",
  RETENTION: "保存期限",
  USER_RIGHTS: "用户权利",
  CONTACT: "联系方式",
  OTHER: "其他"
};

/**
 * 新出现（ADDED）条款的默认风险等级规则：
 * 数据收集 / 信息共享 / 保存期限三类强制标出风险，供法务优先审阅。
 */
export const NEW_SECTION_RISK_RULE: Record<SectionCategory, PrivacyRiskLevel> = {
  DATA_COLLECTION: "HIGH",
  INFORMATION_SHARING: "HIGH",
  RETENTION: "MEDIUM",
  USER_RIGHTS: "LOW",
  CONTACT: "LOW",
  OTHER: "LOW"
};

/** 条款分类识别关键词，usePolicyParser 自动分段时使用 */
export const CATEGORY_KEYWORDS: { category: SectionCategory; keywords: string[] }[] = [
  { category: "INFORMATION_SHARING", keywords: ["共享", "分享", "提供给", "转让", "委托处理", "第三方", "公开披露", "SDK"] },
  { category: "RETENTION", keywords: ["保存期限", "存储期限", "保留", "保存多久", "期限", "删除", "留存"] },
  { category: "DATA_COLLECTION", keywords: ["收集", "采集", "获取", "记录", "设备信息", "个人信息", "敏感信息", "地理位置", "cookie", "Cookie"] },
  { category: "USER_RIGHTS", keywords: ["权利", "撤回同意", "注销", "查询", "更正", "复制", "转移"] },
  { category: "CONTACT", keywords: ["联系", "客服", "邮箱", "电话", "反馈"] }
];
