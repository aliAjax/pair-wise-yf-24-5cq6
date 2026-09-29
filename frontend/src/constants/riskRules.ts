import type { PrivacyRiskLevel } from "../types/PrivacyRiskLevel";
import type { SectionCategory } from "../types/SectionCategory";

/**
 * 新增条款的风险判定规则：先按关键词命中类别，再按高敏信号上调风险等级。
 * 风险标注页与导入解析共用，法务可以在风险标注页手工覆盖判定结果。
 */
export interface RiskRuleSignal {
  category: SectionCategory;
  /** 命中即使用的基线风险；若同时出现 criticalKeywords 则升级为 CRITICAL */
  baseLevel: PrivacyRiskLevel;
  keywords: string[];
  criticalKeywords: string[];
}

export const RISK_RULES: RiskRuleSignal[] = [
  {
    category: "INFORMATION_SHARING",
    baseLevel: "HIGH",
    keywords: ["共享", "分享", "提供给第三方", "第三方", "转让", "对外提供", "SDK", "合作伙伴", "委托处理"],
    criticalKeywords: ["向第三方共享", "出售", "出售给", "披露给", "授权合作伙伴", "转售"]
  },
  {
    category: "DATA_COLLECTION",
    baseLevel: "MEDIUM",
    keywords: ["收集", "采集", "获取", "记录", "设备信息", "位置", "通讯录", "相册", "麦克风", "摄像头", "个人信息"],
    criticalKeywords: ["身份证", "银行卡", "生物识别", "指纹", "人脸", "精确定位", "位置信息", "行踪轨迹", "医疗健康", "金融账户", "敏感个人信息"]
  },
  {
    category: "RETENTION",
    baseLevel: "MEDIUM",
    keywords: ["保存", "保留", "存储期限", "保存期限", "留存", "存储时间", "删除", "匿名化"],
    criticalKeywords: ["长期保存", "永久保存", "无限期", "最长"]
  },
  {
    category: "USER_RIGHTS",
    baseLevel: "LOW",
    keywords: ["访问", "更正", "删除", "撤回同意", "注销账户", "权利", "复制", "转移"],
    criticalKeywords: []
  },
  {
    category: "SECURITY",
    baseLevel: "MEDIUM",
    keywords: ["安全", "加密", "防护", "安全措施", "保密", "风险"],
    criticalKeywords: ["安全事件", "泄露"]
  },
  {
    category: "CONTACT",
    baseLevel: "LOW",
    keywords: ["联系我们", "联系方式", "客服", "邮箱", "投诉", "dpo", "个人信息保护负责人"],
    criticalKeywords: []
  }
];

/** 未命中任何类别规则时的默认值 */
export const DEFAULT_RISK_LEVEL: PrivacyRiskLevel = "LOW";
export const DEFAULT_CATEGORY: SectionCategory = "OTHER";

/** 审阅备注标签：ReviewChecklist 下拉与导出摘要共用 */
export const REVIEW_NOTE_TAGS = ["合规", "需修改", "存疑", "已沟通", "结论沿用"] as const;
