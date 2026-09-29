import { defineStore } from "pinia";
import { computed, ref } from "vue";
import * as sectionApi from "../api/PolicySection";
import type { PolicySection } from "../types/PolicySection";
import type { PrivacyRiskLevel } from "../types/PrivacyRiskLevel";
import type { SectionCategory } from "../types/SectionCategory";
import { annotateSection } from "../services/policySectionService";

/** 条款段落 store：风险标注页手工覆盖自动判定结果 */
export const usePolicySectionStore = defineStore("policySection", () => {
  const rows = ref<PolicySection[]>([]);
  const loading = ref(false);

  const byDocument = computed(() => {
    const map = new Map<number, PolicySection[]>();
    rows.value.forEach((section) => {
      map.set(section.document_id, [...(map.get(section.document_id) ?? []), section]);
    });
    return map;
  });

  async function load(): Promise<void> {
    loading.value = true;
    rows.value = await sectionApi.listPolicySection();
    loading.value = false;
  }

  async function annotate(sectionId: number, patch: { category?: SectionCategory; risk_level?: PrivacyRiskLevel }) {
    const updated = await annotateSection(sectionId, patch);
    const index = rows.value.findIndex((row) => row.id === sectionId);
    if (index >= 0) rows.value[index] = updated;
    return updated;
  }

  function getSection(id: number | null | undefined): PolicySection | undefined {
    return rows.value.find((section) => section.id === id);
  }

  return { rows, loading, byDocument, load, annotate, getSection };
});
