import { defineStore } from "pinia";
import { computed, ref } from "vue";
import * as documentApi from "../api/PolicyDocument";
import * as sectionApi from "../api/PolicySection";
import type { PolicyDocument } from "../types/PolicyDocument";
import type { PolicySection } from "../types/PolicySection";
import { AppError } from "../utils/appError";
import { recordLog } from "../utils/logger";
import { deletePolicyDocument, importPolicyDocument, updatePolicyDocumentMeta } from "../services/policyDocumentService";
import { deleteCascadeForDocument } from "../services/diffService";

/** 政策文档 store：导入、版本列表、级联删除，业务规则在 service 层 */
export const usePolicyDocumentStore = defineStore("policyDocument", () => {
  const rows = ref<PolicyDocument[]>([]);
  const sections = ref<PolicySection[]>([]);
  const loading = ref(false);
  const lastError = ref<string>("");

  const sorted = computed(() => [...rows.value].sort((a, b) => a.imported_at.localeCompare(b.imported_at)));
  const latest = computed(() => sorted.value[sorted.value.length - 1] ?? null);

  async function load(): Promise<void> {
    loading.value = true;
    try {
      const [documentRows, sectionRows] = await Promise.all([
        documentApi.listPolicyDocument(),
        sectionApi.listPolicySection()
      ]);
      rows.value = documentRows;
      sections.value = sectionRows;
    } catch (error) {
      lastError.value = error instanceof AppError ? error.message : "文档加载失败";
    } finally {
      loading.value = false;
    }
  }

  async function importDocument(input: { title: string; version_label: string; raw_text: string }) {
    // store/controller 层二次包装异常，service 层抛出的 AppError 直接透传文案
    try {
      const result = await importPolicyDocument(input);
      rows.value.push(result.document);
      sections.value.push(...result.sections);
      return result;
    } catch (error) {
      recordLog("PolicyDocument", "update", { id: 0, fields: `导入失败:${error instanceof Error ? error.message : "未知错误"}` });
      throw error;
    }
  }

  async function renameDocument(id: number, patch: Pick<PolicyDocument, "title" | "version_label">): Promise<void> {
    await updatePolicyDocumentMeta(id, patch);
    await load();
  }

  async function removeDocument(id: number): Promise<void> {
    await deleteCascadeForDocument(id);
    await deletePolicyDocument(id);
    rows.value = rows.value.filter((doc) => doc.id !== id);
    sections.value = sections.value.filter((section) => section.document_id !== id);
  }

  function getDocument(id: number | null | undefined): PolicyDocument | undefined {
    return rows.value.find((doc) => doc.id === id);
  }

  function sectionsOf(documentId: number): PolicySection[] {
    return sections.value
      .filter((section) => section.document_id === documentId)
      .sort((a, b) => a.section_no.localeCompare(b.section_no, "zh-CN", { numeric: true }));
  }

  return { rows, sections, loading, lastError, sorted, latest, load, importDocument, renameDocument, removeDocument, getDocument, sectionsOf };
});
