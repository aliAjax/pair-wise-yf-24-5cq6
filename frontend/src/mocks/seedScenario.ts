import type { DiffResult } from "../types/DiffResult";
import type { PolicyDocument } from "../types/PolicyDocument";
import type { ReviewNote } from "../types/ReviewNote";
import { SAMPLE_POLICY_V1, SAMPLE_POLICY_V2, SAMPLE_POLICY_V3 } from "./samplePolicyText";

/** 种子场景说明（首次启动通过真实解析/对比/审阅引擎生成）：
 * v1 -> v2：第2/3/4/7条改动，第8/9条新增（Cookie、未成年人保护），第5/6条未变
 * 审查员已确认第2条（收集精确位置）、第5条（保存期限未变），第3条留待处理并备注
 * v2 -> v3：第4条“出售位置信息”、第5条“长期保存”内容再变 → 确认退回待处理，旧备注保留；
 * 第9条未成年人保护改动 → 待处理；未变条款的确认结论沿用。
 */
export const SEED_SCENARIO = {
  v1: { title: "某服务隐私政策", version_label: "v1.0", raw_text: SAMPLE_POLICY_V1 },
  v2: { title: "某服务隐私政策", version_label: "v2.0", raw_text: SAMPLE_POLICY_V2 },
  v3: { title: "某服务隐私政策", version_label: "v3.0", raw_text: SAMPLE_POLICY_V3 },
  reviewer: "法务-林岚",
  notes: {
    informationUse: "个性化推荐的合法性基础需补充说明，暂不确认。"
  }
} as const;

export interface SeedResult {
  documents: PolicyDocument[];
  diffs: DiffResult[];
  notes: ReviewNote[];
  pairV1V2: { oldId: number; newId: number };
  pairV2V3: { oldId: number; newId: number };
}
