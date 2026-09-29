import { readMeta, writeMeta } from "../utils/storage";
import { importPolicyDocument } from "./policyDocumentService";
import { ensureDiffPair, findDiffPair, setDiffStatus } from "./diffService";
import { addReviewNote } from "./reviewNoteService";
import { SEED_SCENARIO } from "../mocks/seedScenario";

const SEED_FLAG_KEY = "seeded";

export function isSeeded(): boolean {
  return readMeta<boolean>(SEED_FLAG_KEY, false);
}

/** 首次启动播种：走真实的导入、分段、风险标注、对比生成与审阅链路，保证种子数据可用 */
export async function seedIfNeeded(): Promise<boolean> {
  if (isSeeded()) return false;

  const v1 = await importPolicyDocument(SEED_SCENARIO.v1);
  const v2 = await importPolicyDocument(SEED_SCENARIO.v2);
  const v3 = await importPolicyDocument(SEED_SCENARIO.v3);

  // v1 -> v2 对比，并模拟审查员的部分审阅结论（必须发生在 v2->v3 对比之前，才能演示结论沿用/失效）
  await ensureDiffPair(v1.document.id, v2.document.id);
  const pair12 = await findDiffPair(v1.document.id, v2.document.id);
  const findByHeading = (heading: string) => pair12.find((diff) => diff.heading.includes(heading));

  // 收集条款：审查员确认；v2->v3 内容未变 → 结论沿用
  const collect = findByHeading("收集的信息");
  if (collect) await setDiffStatus(collect.id, "CONFIRMED", SEED_SCENARIO.reviewer);

  // 信息使用：留待处理并写备注；v2->v3 未变 → 仍是待处理，备注继承
  const useInfo = findByHeading("信息使用");
  if (useInfo) {
    await addReviewNote({
      diff_result_id: useInfo.id,
      tag: "需修改",
      comment: SEED_SCENARIO.notes.informationUse,
      reviewer: SEED_SCENARIO.reviewer
    });
  }

  // 信息共享：审查员已确认并留备注；v3 改成“出售精确位置”→ 确认退回待处理、备注保留继承（主线演示）
  const sharing = findByHeading("信息共享");
  if (sharing) {
    await setDiffStatus(sharing.id, "CONFIRMED", SEED_SCENARIO.reviewer);
    await addReviewNote({
      diff_result_id: sharing.id,
      tag: "已沟通",
      comment: "已确认：仅限必要的广告归因共享，不得出售个人信息。",
      reviewer: SEED_SCENARIO.reviewer
    });
  }

  // v2 -> v3 对比：触发确认失效/沿用/备注继承规则
  await ensureDiffPair(v2.document.id, v3.document.id);

  writeMeta(SEED_FLAG_KEY, true);
  return true;
}

/** 开发/排错用：清空播种标记（页面暂不暴露入口） */
export function resetSeedFlag(): void {
  writeMeta(SEED_FLAG_KEY, false);
}
