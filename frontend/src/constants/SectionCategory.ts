import { SectionCategoryValues, type SectionCategory as SectionCategoryT } from "../types/SectionCategory";

/** 条款类别常量：需求要求新出现的条款按数据收集、信息共享、保存期限标出风险 */
export const SectionCategory = SectionCategoryValues;
export type SectionCategory = SectionCategoryT;
export const SectionCategoryText: Record<SectionCategory, string> = {
  DATA_COLLECTION: "数据收集",
  INFORMATION_SHARING: "信息共享",
  RETENTION: "保存期限",
  USER_RIGHTS: "用户权利",
  SECURITY: "信息安全",
  CONTACT: "联系方式",
  OTHER: "其他"
};
