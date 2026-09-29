import { isStorageAvailable, writeRows } from "../api/localStorage";
import { mockData } from "./seedData";
import { logAction } from "../utils/logger";

const SEED_FLAG = "policy-diff:seeded:v2";

/** 首次启动时把两版示例政策播种进 localStorage，老占位数据直接覆盖 */
export const ensureSeedData = (): void => {
  if (!isStorageAvailable()) return;
  if (window.localStorage.getItem(SEED_FLAG) === "1") return;

  writeRows("policyDocument", mockData.policyDocument);
  writeRows("policySection", mockData.policySection);
  writeRows("diffResult", mockData.diffResult);
  writeRows("reviewNote", mockData.reviewNote);
  window.localStorage.setItem(SEED_FLAG, "1");
  logAction("PolicyDocument", "IMPORT", { id: 0, title: "示例政策两版", sectionCount: mockData.policySection.length });
};
