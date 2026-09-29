<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { usePolicyDocumentStore } from "../stores/PolicyDocumentStore";
import { useDiffResultStore } from "../stores/DiffResultStore";
import ImportPanel from "../components/common/ImportPanel.vue";
import EmptyState from "../components/common/EmptyState.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import StatCard from "../components/common/StatCard.vue";
import { formatDate } from "../utils/formatters";
import { resolveErrorMessage } from "../utils/errors";
import { logAction } from "../utils/logger";
import type { PolicyDocument } from "../types/PolicyDocument";

const router = useRouter();
const documentStore = usePolicyDocumentStore();
const diffStore = useDiffResultStore();

const feedback = ref("");
const feedbackKind = ref<"success" | "error">("success");
const selectedIds = ref<number[]>([]);

const documents = computed(() => documentStore.sortedByImported);
const sectionCountOf = (id: number) => documentStore.sectionsOf(id).length;

const diffPairs = computed(() => {
  const keys = new Set(
    diffStore.rows.map((diff) => `${diff.old_document_id ?? "-"}->${diff.new_document_id ?? "-"}`)
  );
  return keys;
});

onMounted(async () => {
  await Promise.all([documentStore.load(), diffStore.load()]);
});

const onImport = async (payload: {
  title: string;
  versionLabel: string;
  rawText: string;
  drafts: import("../hooks/usePolicyParser").ParsedSectionDraft[];
}) => {
  feedback.value = "";
  try {
    const doc = await documentStore.importPolicy(payload);
    feedbackKind.value = "success";
    feedback.value = `已导入《${doc.title}》${doc.version_label}，共 ${payload.drafts.length} 个条款。`;
    selectedIds.value = [];
    ElMessage.success("政策版本导入成功");
  } catch (error) {
    feedbackKind.value = "error";
    feedback.value = resolveErrorMessage(error);
    ElMessage.error(feedback.value);
  }
};

const toggleSelect = (id: number) => {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((item) => item !== id)
    : [...selectedIds.value, id].slice(-2);
};

const goCompare = () => {
  if (selectedIds.value.length !== 2) return;
  const [oldId, newId] = [...selectedIds.value].sort(
    (a, b) =>
      (documentStore.getById(a)?.imported_at ?? "").localeCompare(documentStore.getById(b)?.imported_at ?? "")
  );
  router.push({ path: "/compare", query: { old: String(oldId), new: String(newId) } });
};

const removeDocument = async (doc: PolicyDocument) => {
  try {
    await ElMessageBox.confirm(
      `确认删除《${doc.title}》${doc.version_label}？相关条款、差异与审阅备注会一并删除。`,
      "删除政策版本",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" }
    );
  } catch {
    return;
  }
  await documentStore.removeDocument(doc.id);
  selectedIds.value = selectedIds.value.filter((id) => id !== doc.id);
  await diffStore.load();
};

const exportDocument = (doc: PolicyDocument) => {
  const blob = new Blob([doc.raw_text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${doc.title}-${doc.version_label}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
  logAction("PolicyDocument", "EXPORT", { id: doc.id, title: doc.title });
};

const hasPair = (doc: PolicyDocument) =>
  [...diffPairs.value].some((key) => key.split("->").includes(String(doc.id)));
</script>

<template>
  <section class="documents-page">
    <div class="metrics three">
      <StatCard label="已导入版本" :value="documents.length" />
      <StatCard label="条款总数" :value="documentStore.sections.length" />
      <StatCard label="待选版本" :value="`${selectedIds.length} / 2`" />
    </div>

    <p v-if="feedback" class="inline-feedback" :class="feedbackKind">{{ feedback }}</p>

    <div class="workbench documents-grid">
      <ImportPanel :importing="documentStore.importing" @import="onImport" />

      <div class="panel">
        <h2>版本列表</h2>
        <p class="panel-hint">勾选两个版本后发起对比，系统按导入时间自动区分旧版 / 新版。</p>
        <EmptyState v-if="documents.length === 0" title="还没有导入任何政策版本" hint="在左侧粘贴第一版政策正文开始" />
        <ul v-else class="document-list">
          <li
            v-for="doc in documents"
            :key="doc.id"
            :class="{ selected: selectedIds.includes(doc.id) }"
            @click="toggleSelect(doc.id)"
          >
            <label class="pick">
              <input :checked="selectedIds.includes(doc.id)" type="checkbox" @click.stop="toggleSelect(doc.id)" />
            </label>
            <div class="doc-meta">
              <strong>{{ doc.title }}</strong>
              <span class="doc-version">{{ doc.version_label }}</span>
              <span class="doc-sub">{{ sectionCountOf(doc.id) }} 个条款 · 导入于 {{ formatDate(doc.imported_at) }}</span>
              <div class="doc-tags">
                <StatusBadge v-if="hasPair(doc)" kind="raw" value="HAS_DIFF" />
              </div>
            </div>
            <div class="doc-actions" @click.stop>
              <button class="btn mini ghost" @click="exportDocument(doc)">导出原文</button>
              <button class="btn mini danger" @click="removeDocument(doc)">删除</button>
            </div>
          </li>
        </ul>
        <button class="btn primary wide" :disabled="selectedIds.length !== 2" @click="goCompare">
          对比选中的两个版本
        </button>
      </div>
    </div>
  </section>
</template>
