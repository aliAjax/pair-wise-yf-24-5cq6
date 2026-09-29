<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import DiffViewer from "../components/common/DiffViewer.vue";
import ReviewChecklist from "../components/common/ReviewChecklist.vue";
import EmptyState from "../components/common/EmptyState.vue";
import StatCard from "../components/common/StatCard.vue";
import VersionPairSelector from "../components/common/VersionPairSelector.vue";
import { REVIEW_STATUS_FILTERS } from "../constants/filters";
import { DiffTypeText } from "../constants/DiffType";
import { ReviewStatusText } from "../constants/ReviewStatus";
import { usePolicyDocumentStore } from "../stores/PolicyDocumentStore";
import { useDiffResultStore } from "../stores/DiffResultStore";
import { useReviewNoteStore } from "../stores/ReviewNoteStore";
import { downloadMarkdown, exportReviewMarkdown } from "../services/exportService";
import { formatDate, formatPercent } from "../utils/formatters";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import type { ReviewStatus } from "../types/ReviewStatus";

const documentStore = usePolicyDocumentStore();
const diffStore = useDiffResultStore();
const noteStore = useReviewNoteStore();

const oldId = ref(0);
const newId = ref(0);
const statusFilter = ref<ReviewStatus | "ALL">("ALL");
const openDiffId = ref<number | null>(null);
const exporting = ref(false);
const reviewer = useLocalStorageState<string>("reviewer-name", "法务-当前用户");

onMounted(async () => {
  await Promise.all([documentStore.load(), diffStore.load(), noteStore.load()]);
  const docs = documentStore.sorted;
  if (docs.length >= 2) {
    oldId.value = docs[docs.length - 2].id;
    newId.value = docs[docs.length - 1].id;
    await diffStore.selectPair(oldId.value, newId.value);
  }
});

const pairDiffs = computed(() =>
  diffStore.rows
    .filter((diff) => diff.old_document_id === oldId.value && diff.new_document_id === newId.value)
    .filter((diff) => (statusFilter.value === "ALL" ? true : diff.status === statusFilter.value))
    .sort((a, b) => {
      const statusWeight: Record<string, number> = { OPEN: 0, CONFIRMED: 1, IGNORED: 2, RESOLVED: 3 };
      return (
        statusWeight[a.status] - statusWeight[b.status] ||
        a.section_no.localeCompare(b.section_no, "zh-CN", { numeric: true })
      );
    })
);

const pairStats = computed(() => {
  const all = diffStore.rows.filter((diff) => diff.old_document_id === oldId.value && diff.new_document_id === newId.value);
  const actionable = all.filter((diff) => diff.diff_type !== "UNCHANGED");
  const done = actionable.filter((diff) => diff.status !== "OPEN").length;
  return {
    total: actionable.length,
    open: actionable.filter((diff) => diff.status === "OPEN").length,
    confirmed: actionable.filter((diff) => diff.status === "CONFIRMED").length,
    percent: formatPercent(done, actionable.length)
  };
});

async function onPairChange(payload: { oldId: number; newId: number }) {
  oldId.value = payload.oldId;
  newId.value = payload.newId;
  try {
    await diffStore.selectPair(payload.oldId, payload.newId);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "切换版本失败");
  }
}

function sectionOf(id: number | null) {
  return documentStore.sections.find((section) => section.id === id) ?? null;
}

async function handleExport() {
  exporting.value = true;
  try {
    const markdown = await exportReviewMarkdown(oldId.value, newId.value);
    const oldDoc = documentStore.getDocument(oldId.value);
    const newDoc = documentStore.getDocument(newId.value);
    downloadMarkdown(`审阅摘要_${oldDoc?.version_label ?? oldId.value}_${newDoc?.version_label ?? newId.value}.md`, markdown);
    ElMessage.success("Markdown 摘要已导出");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "导出失败");
  } finally {
    exporting.value = false;
  }
}

function noteCount(diffId: number) {
  return noteStore.notesOf(diffId).length;
}
</script>

<template>
  <div class="page-inner">
    <header class="page-title">
      <div>
        <p class="eyebrow">STEP 4 · REVIEW</p>
        <h2>审阅清单</h2>
        <p class="subtitle">
          按状态逐条处理差异并沉淀备注；导入更新版本后，条款内容变过的确认自动退回待处理，旧备注保留并标注来源。
        </p>
      </div>
      <div class="review-head-ops">
        <VersionPairSelector :documents="documentStore.sorted" :old-id="oldId" :new-id="newId" @change="onPairChange" />
        <el-input v-model="reviewer" size="default" placeholder="审查员姓名" style="width: 180px" />
        <el-button type="primary" :loading="exporting" :disabled="oldId === 0" @click="handleExport">导出 Markdown 摘要</el-button>
      </div>
    </header>

    <section class="metrics metrics-4">
      <StatCard label="需处理差异" :value="pairStats.total" />
      <StatCard label="待处理" :value="pairStats.open" />
      <StatCard label="已确认" :value="pairStats.confirmed" />
      <StatCard label="审阅进度" :value="pairStats.percent" />
    </section>

    <section class="panel">
      <div class="filter-bar">
        <el-radio-group v-model="statusFilter" size="small">
          <el-radio-button label="ALL">全部</el-radio-button>
          <el-radio-button v-for="status in REVIEW_STATUS_FILTERS" :key="status" :label="status">
            {{ ReviewStatusText[status] }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <EmptyState v-if="pairDiffs.length === 0" title="该状态下暂无待办" description="可切换版本对或状态过滤条件" />

      <div v-else class="review-list">
        <article
          v-for="diff in pairDiffs"
          :key="diff.id"
          class="review-row"
          :class="{ open: openDiffId === diff.id, 'status-open': diff.status === 'OPEN' }"
        >
          <header class="review-row-head" @click="openDiffId = openDiffId === diff.id ? null : diff.id">
            <span class="diff-type-chip" :class="`chip-${diff.diff_type.toLowerCase()}`">{{ DiffTypeText[diff.diff_type] }}</span>
            <strong>{{ diff.section_no }} {{ diff.heading }}</strong>
            <el-tag size="small" :type="diff.status === 'CONFIRMED' ? 'success' : diff.status === 'OPEN' ? 'warning' : 'info'">
              {{ ReviewStatusText[diff.status] }}
            </el-tag>
            <el-tag v-if="noteCount(diff.id) > 0" size="small" effect="plain">备注 {{ noteCount(diff.id) }}</el-tag>
            <el-tag
              v-if="noteStore.notesOf(diff.id).some((n) => n.inherited_from_note_id !== null)"
              size="small"
              type="warning"
            >含沿用备注</el-tag>
            <span class="review-reviewer muted" v-if="diff.reviewer">{{ diff.reviewer }} · {{ formatDate(diff.reviewed_at) }}</span>
            <span class="diff-caret">{{ openDiffId === diff.id ? "收起 ▴" : "处理 ▾" }}</span>
          </header>
          <el-collapse-transition>
            <div v-show="openDiffId === diff.id" class="review-row-body">
              <p class="diff-summary">{{ diff.summary }}</p>
              <DiffViewer :diff="diff" :old-section="sectionOf(diff.old_section_id)" :new-section="sectionOf(diff.section_id)" />
              <ReviewChecklist :diff="diff" :notes="noteStore.notesOf(diff.id)" :reviewer="reviewer" />
            </div>
          </el-collapse-transition>
        </article>
      </div>
    </section>
  </div>
</template>
