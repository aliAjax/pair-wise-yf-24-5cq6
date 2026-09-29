import type { PrivacyRiskLevel } from "../types/PrivacyRiskLevel";
import type { SectionCategory } from "../types/SectionCategory";
import { DEFAULT_CATEGORY, DEFAULT_RISK_LEVEL, RISK_RULES } from "../constants/riskRules";

export interface RiskVerdict {
  category: SectionCategory;
  riskLevel: PrivacyRiskLevel;
  matchedKeyword: string | null;
  critical: boolean;
}

/**
 * 新出现条款的自动风险标注：
 * 命中类别规则给出基线等级；命中该类别“严重信号”关键词直接 CRITICAL。
 * 多个类别同时命中时，取基线等级最高的；严重信号全局优先。
 */
export function classifySection(text: string): RiskVerdict {
  const haystack = text.toLowerCase();

  let best: RiskVerdict = {
    category: DEFAULT_CATEGORY,
    riskLevel: DEFAULT_RISK_LEVEL,
    matchedKeyword: null,
    critical: false
  };
  const rank: Record<PrivacyRiskLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

  RISK_RULES.forEach((rule) => {
    const hit = rule.keywords.find((keyword) => haystack.includes(keyword.toLowerCase()));
    if (!hit) return;
    const criticalHit = rule.criticalKeywords.find((keyword) => haystack.includes(keyword.toLowerCase()));
    const level: PrivacyRiskLevel = criticalHit ? "CRITICAL" : rule.baseLevel;
    if (rank[level] > rank[best.riskLevel] || best.matchedKeyword === null) {
      best = { category: rule.category, riskLevel: level, matchedKeyword: criticalHit ?? hit, critical: Boolean(criticalHit) };
    }
  });

  return best;
}
