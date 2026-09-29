import { SAMPLE_POLICY_V1, SAMPLE_POLICY_V2, SAMPLE_POLICY_V3 } from "./samplePolicyText";

/** 导入页“载入示例文本”可选版本 */
export interface SamplePolicyOption {
  version_label: string;
  title: string;
  raw_text: string;
}

export const SAMPLE_POLICY_OPTIONS: SamplePolicyOption[] = [
  { version_label: "v1.0", title: "某服务隐私政策", raw_text: SAMPLE_POLICY_V1 },
  { version_label: "v2.0", title: "某服务隐私政策", raw_text: SAMPLE_POLICY_V2 },
  { version_label: "v3.0", title: "某服务隐私政策", raw_text: SAMPLE_POLICY_V3 }
];
