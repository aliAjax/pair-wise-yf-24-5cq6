import { defineStore } from "pinia";
import { computed, ref } from "vue";
import * as diffApi from "../api/DiffResult";
import type { DiffResult } from "../types/DiffResult";
import type { ReviewStatus } from "../types/ReviewStatus";
import { ensureDiffPair, findDiffPair, setDiffStatus } from "../services/diffService";
import { recordLog } from "../utils/logger";

/** 差异结果 store：版本对比生成、确认/退回，确认失效逻辑在 service 层 */
export const useDiffResultStore = defineStore("diffResult", () => {
  const rows = ref<DiffResult[]>([]);
  const loading = ref(false);
  const activeOldId = ref<number>(0);
  const activeNewId = ref<number>(0);

  const activePair = computed(() =>
    rows.value.filter((diff) => diff.old_document_id === activeOldId.value && diff.new_document_id === activeNewId.value)
  );

  async function load(): Promise<void> {
    loading.value = true;
    rows.value = await diffApi.listDiffResult();
    loading.value = false;
  }

  async function selectPair(oldId: number, newId: number): Promise<DiffResult[]> {
    activeOldId.value = oldId;
    activeNewId.value = newId;
    const existing = await findDiffPair(oldId, newId);
    if (existing.length > 0) {
      // 历史差异可能已被更新的版本对比标记取代，整表刷新
      rows.value = await diffApi.listDiffResult();
      return existing;
    }
    const result = await compare(oldId, newId);
    return result.diffs;
  }

  /** 导入新版本后立即与上一版对比的主线入口 */
  async function compare(oldId: number, newId: number) {
    const result = await ensureDiffPair(oldId, newId);
    activeOldId.value = oldId;
    activeNewId.value = newId;
    // 重新对比会改写历史差异（superseded_by），整表以 localStorage 为准
    rows.value = await diffApi.listDiffResult();
    return result;
  }

  async function setStatus(diffId: number, status: ReviewStatus, reviewer: string) {
    try {
      const updated = await setDiffStatus(diffId, status, reviewer);
      const index = rows.value.findIndex((row) => row.id === diffId);
      if (index >= 0) rows.value[index] = updated;
      return updated;
    } catch (error) {
      recordLog("DiffResult", "statusChange", { id: diffId, from: "ERROR", to: status, reviewer });
      throw error;
    }
  }

  return { rows, loading, activeOldId, activeNewId, activePair, load, selectPair, compare, setStatus };
});
