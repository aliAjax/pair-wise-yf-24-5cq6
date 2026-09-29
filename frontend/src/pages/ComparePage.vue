<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePolicyDocumentStore } from "../stores/PolicyDocumentStore";
import { useDiffResultStore } from "../stores/DiffResultStore";
import { useReviewNoteStore } from "../stores/ReviewNoteStore";
import { DIFF_TYPE_FILTERS, DIFF_TYPE_TEXT } from "../constants/DiffType";
import { RISK_LEVEL_FILTERS } from "../constants/PrivacyRiskLevel";
import type { DiffType } from "../types/DiffType";
import type { PrivacyRiskLevel } from "../types/PrivacyRiskLevel";
import type { DiffResult } from "../types/DiffResult";
import type { PolicySection } from "../types/PolicySection";
import { diffText } from "../hooks/useTextDiff";
import DiffViewer from "../components/common/DiffViewer.vue";
import RiskTag from "../components/common/RiskTag.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import EmptyState from "../components/common/EmptyState.vue";
import StatCard from "../components/common/StatCard.vue";
import { resolveErrorMessage } from "../utils/errors";
import { formatDate } from "../utils/formatters";

const route = useRoute();
const router = useRouter();
const documentStore = usePolicyDocumentStore();
const diffStore = useDiffResultStore();
const reviewStore = useReviewNoteStore();

const oldId = ref<number | null>(null);
const newId = ref<number | null>(null);
const activeTypes = ref<DiffType[]>(["ADDED", "REMOVED", "MODIFIED", "MOVED"]);
const activeRisks = ref<PrivacyRiskLevel[]>([]);
const keyword = ref("");
const expandedKey = ref<string | null>(null);
const feedback = ref("");
const feedbackKind = ref<"success" | "error">("success");
const reopenedKeys = ref<Set<string>>(new Set());

const computeReopenedKeys = (diffs: DiffResult[]) => {
  const keys = new Set<string>();
  diffs.forEach((diff) => {
    if (reviewStore.notesByDiff(diff.id).some((note) => note.reopened)) keys.add(diff.match_key);
  });
  reopenedKeys.value = keys;
};

const documents = computed(() => documentStore.sortedByImported);

const oldDocument = computed(() => documentStore.getById(oldId.value));
const newDocument = computed(() => documentStore.getById(newId.value));

const sectionsFor = (documentId: number | null): PolicySection[] =>
  documentId === null ? [] : documentStore.sectionsOf(documentId);

const pairDiffs = computed<DiffResult[]>(() => {
  if (oldId.value === null || newId.value === null) return [];
  return diffStore.diffsByPair(oldId.value, newId.value);
});

const counts = computed(() => ({
  ADDED: pairDiffs.value.filter((diff) => diff.diff_type === "ADDED").length,
  REMOVED: pairDiffs.value.filter((diff) => diff.diff_type === "REMOVED").length,
  MODIFIED: pairDiffs.value.filter((diff) => diff.diff_type === "MODIFIED").length,
  MOVED: pairDiffs.value.filter((diff) => diff.diff_type === "MOVED").length
}));

const filteredDiffs = computed(() =>
  [...pairDiffs.value]
    .sort((a, b) => {
      // 按新版条款顺序排列，移除项追加到末尾
      const aSection = sectionsFor(newId.value).find((s) => s.id === a.new_section_id)
        ?? sectionsFor(oldId.value).find((s) => s.id === a.old_section_id);
      const bSection = sectionsFor(newId.value).find((s) => s.id === b.new_section_id)
        ?? sectionsFor(oldId.value).find((s) => s.id === b.old_section_id);
      return (aSection?.section_no ?? "z").localeCompare(bSection?.section_no ?? "z", "zh-CN-u-kn-true");
    })
    .filter((diff) => activeTypes.value.includes(diff.diff_type))
    .filter((diff) => activeRisks.value.length === 0 || activeRisks.value.includes(diff.risk_level))
    .filter((diff) => {
      if (!keyword.value.trim()) return true;
      const key = keyword.value.trim();
      return diff.summary.includes(key) || diff.match_key.includes(key);
    })
);

const oldSectionOf = (diff: DiffResult) =>
  sectionsFor(oldId.value).find((section) => section.id === diff.old_section_id) ?? null;
const newSectionOf = (diff: DiffResult) =>
  sectionsFor(newId.value).find((section) => section.id === diff.new_section_id) ?? null;

const inlineLines = (diff: DiffResult) => {
  const oldSection = oldSectionOf(diff);
  const newSection = newSectionOf(diff);
  return diffText(oldSection?.content ?? "", newSection?.content ?? "");
};

const toggleType = (type: DiffType) => {
  activeTypes.value = activeTypes.value.includes(type)
    ? activeTypes.value.filter((item) => item !== type)
    : [...activeTypes.value, type];
};

const toggleRisk = (level: PrivacyRiskLevel) => {
  activeRisks.value = activeRisks.value.includes(level)
    ? activeRisks.value.filter((item) => item !== level)
    : [...activeRisks.value, level];
};

const runCompare = async () => {
  feedback.value = "";
  if (oldId.value === null || newId.value === null) return;
  try {
    const outcome = await diffStore.compare(oldId.value, newId.value);
    await reviewStore.load();
    computeReopenedKeys(diffStore.diffsByPair(oldId.value, newId.value));
    feedbackKind.value = "success";
    feedback.value =
      outcome.reopened.reopenedDiffIds.length > 0
        ? `对比完成：${outcome.diffs.length} 条变化；其中 ${outcome.reopened.reopenedDiffIds.length} 条条款在确认后又被改动，已退回待处理（旧备注保留）。`
        : `对比完成：共 ${outcome.diffs.length} 条变化。`;
    await reviewStore.load();
  } catch (error) {
    feedbackKind.value = "error";
    feedback.value = resolveErrorMessage(error);
  }
};

const scrollToDiff = (matchKey: string) => {
  expandedKey.value = matchKey;
  document.getElementById(`diff-${matchKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
};

const goReview = (matchKey: string) => {
  router.push({ path: "/review", query: { old: route.query.old, new: route.query.new, focus: matchKey } });
};

onMounted(async () => {
  await Promise.all([documentStore.load(), diffStore.load(), reviewStore.load()]);
  oldId.value = route.query.old ? Number(route.query.old) : documents.value[0]?.id ?? null;
  newId.value = route.query.new ? Number(route.query.new) : documents.value[1]?.id ?? null;
  computeReopenedKeys(pairDiffs.value);
});

watch(
  () => [route.query.old, route.query.new],
  ([nextOld, nextNew]) => {
    if (nextOld) oldId.value = Number(nextOld);
    if (nextNew) newId.value = Number(nextNew);
  }
);

const latestNoteOf = (diff: DiffResult) => reviewStore.latestByDiff.get(diff.id);
const isExpanded = (diff: DiffResult) => expandedKey.value === diff.match_key || diff.diff_type === "ADDED";
</script>

<template>
  <section class="compare-page">
    <div class="panel compare-picker">
      <div class="picker-fields">
        <label>
          <span>旧版本</span>
          <select v-model="oldId">
            <option v-for="doc in documents" :key="doc.id" :value="doc.id">
              {{ doc.version_label }} — {{ doc.title }}
            </option>
          </select>
        </label>
        <span class="picker-arrow">→</span>
        <label>
          <span>新版本</span>
          <select v-model="newId">
            <option v-for="doc in documents" :key="doc.id" :value="doc.id">
              {{ doc.version_label }} — {{ doc.title }}
            </option>
          </select>
        </label>
        <button class="btn primary" :disabled="oldId === null || newId === null || diffStore.comparing" @click="runCompare">
          {{ diffStore.comparing ? "对比中…" : pairDiffs.length > 0 ? "重新对比" : "开始对比" }}
        </button>
      </div>
      <p v-if="oldDocument && newDocument" class="picker-sub">
        旧版 {{ oldDocument.version_label }}（{{ formatDate(oldDocument.imported_at) }}） 对
        新版 {{ newDocument.version_label }} · 差异生成于 {{ pairDiffs[0] ? formatDate(pairDiffs[0].created_at) : "-" }}
      </p>
    </div>

    <p v-if="feedback" class="inline-feedback" :class="feedbackKind">{{ feedback }}</p>

    <div class="metrics four" v-if="pairDiffs.length > 0">
      <StatCard label="新增条款" :value="counts.ADDED" />
      <StatCard label="移除条款" :value="counts.REMOVED" />
      <StatCard label="改动条款" :value="counts.MODIFIED" />
      <StatCard
        label="高风险变化"
        :value="pairDiffs.filter((diff) => diff.risk_level === 'HIGH' || diff.risk_level === 'CRITICAL').length"
      />
    </div>

    <div v-if="pairDiffs.length > 0" class="panel filter-bar">
      <div class="filter-group">
        <span class="filter-label">变化类型</span>
        <button
          v-for="type in DIFF_TYPE_FILTERS.filter((item) => item !== 'UNCHANGED')"
          :key="type"
          class="chip"
          :class="{ off: !activeTypes.includes(type), ['chip-' + type]: true }"
          @click="toggleType(type)"
        >
          {{ DIFF_TYPE_TEXT[type] }}
        </button>
      </div>
      <div class="filter-group">
        <span class="filter-label">风险</span>
        <button
          v-for="level in RISK_LEVEL_FILTERS"
          :key="level"
          class="chip"
          :class="{ off: !activeRisks.includes(level) }"
          @click="toggleRisk(level)"
        >
          {{ level === "LOW" ? "低" : level === "MEDIUM" ? "中" : level === "HIGH" ? "高" : "严重" }}
        </button>
      </div>
      <input v-model="keyword" class="filter-search" type="text" placeholder="搜索条款标题 / 编号" />
    </div>

    <EmptyState
      v-if="oldId === null || newId === null"
      title="请先导入两个政策版本"
      hint="去「文档导入」页粘贴两版政策"
    />
    <EmptyState
      v-else-if="pairDiffs.length === 0"
      title="尚未生成对比结果"
      hint="选择旧版与新版后点击「开始对比」"
    />
    <EmptyState v-else-if="filteredDiffs.length === 0" title="当前筛选条件下没有变化条款" />

    <div v-else class="diff-list">
      <article
        v-for="diff in filteredDiffs"
        :id="`diff-${diff.match_key}`"
        :key="diff.id"
        class="diff-entry panel"
        :class="['entry-' + diff.diff_type, { reopen: reopenedKeys.has(diff.match_key) }]"
      >
        <header class="diff-entry-head" @click="expandedKey = isExpanded(diff) ? null : diff.match_key">
          <StatusBadge :kind="'diff'" :value="diff.diff_type" />
          <span class="diff-section-no">{{ (newSectionOf(diff) ?? oldSectionOf(diff))?.section_no }}</span>
          <strong class="diff-heading">{{ (newSectionOf(diff) ?? oldSectionOf(diff))?.heading }}</strong>
          <RiskTag :level="diff.risk_level" />
          <StatusBadge
            v-if="latestNoteOf(diff)"
            kind="review"
            :value="latestNoteOf(diff)?.status ?? 'OPEN'"
          />
          <span class="diff-summary">{{ diff.summary }}</span>
          <span class="expand-mark">{{ isExpanded(diff) ? "收起 ▲" : "展开 ▼" }}</span>
        </header>

        <div v-if="reopenedKeys.has(diff.match_key)" class="reopen-inline">
          该条款在你确认后再次变化，确认结论已退回待处理
        </div>

        <div v-if="isExpanded(diff)" class="diff-entry-body">
          <DiffViewer :lines="inlineLines(diff)" />
          <div class="diff-entry-foot">
            <button class="btn mini" @click.stop="scrollToDiff(diff.match_key)">定位段落</button>
            <button class="btn mini primary" @click.stop="goReview(diff.match_key)">去审阅 / 写备注</button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
