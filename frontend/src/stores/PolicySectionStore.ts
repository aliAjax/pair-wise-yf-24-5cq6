import { defineStore } from "pinia";
import { listPolicySection, updatePolicySection } from "../api/PolicySection";
import type { PolicySection } from "../types/PolicySection";
import type { PrivacyRiskLevel } from "../types/PrivacyRiskLevel";
import type { SectionCategory } from "../types/SectionCategory";
import { STATUS_TEXT } from "../constants/statusText";
import { logAction } from "../utils/logger";

export const usePolicySectionStore = defineStore("policySection", {
  state: () => ({ rows: [] as PolicySection[], loading: false }),
  getters: {
    riskCounts: (state) => {
      const counts: Record<PrivacyRiskLevel, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
      state.rows.forEach((section) => {
        counts[section.risk_level] += 1;
      });
      return counts;
    },
    sectionsByDocument: (state) => (documentId: number) =>
      state.rows
        .filter((section) => section.document_id === documentId)
        .sort((a, b) => a.section_no.localeCompare(b.section_no, "zh-CN-u-kn-true"))
  },
  actions: {
    async load() {
      this.loading = true;
      try {
        this.rows = await listPolicySection();
      } finally {
        this.loading = false;
      }
    },
    async reclassify(id: number, category: SectionCategory, riskLevel: PrivacyRiskLevel) {
      const current = this.rows.find((row) => row.id === id);
      if (!current) return;
      const previousRisk = current.risk_level;
      const updated = await updatePolicySection({ ...current, category, risk_level: riskLevel });
      const index = this.rows.findIndex((row) => row.id === id);
      if (index >= 0) this.rows[index] = updated;
      logAction("PolicySection", "RECLASSIFY", {
        id,
        sectionNo: current.section_no,
        fromRisk: STATUS_TEXT.PrivacyRiskLevel[previousRisk],
        toRisk: STATUS_TEXT.PrivacyRiskLevel[riskLevel]
      });
      return updated;
    }
  }
});
