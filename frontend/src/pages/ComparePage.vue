<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import DiffViewer from "../components/common/DiffViewer.vue";
import ReviewChecklist from "../components/common/ReviewChecklist.vue";
import EmptyState from "../components/common/EmptyState.vue";
import StatCard from "../components/common/StatCard.vue";
import VersionPairSelector from "../components/common/VersionPairSelector.vue";
import { DEFAULT_DIFF_FILTER, DIFF_FILTER_TYPES } from "../constants/filters";
import { DiffTypeText } from "../constants/DiffType";
import { ReviewStatusText } from "../constants/ReviewStatus";
import { usePolicyDocumentStore } from "../stores/PolicyDocumentStore";
import { useDiffResultStore } from "../stores/DiffResultStore";
import { useReviewNoteStore } from "../stores/ReviewNoteStore";
import type { DiffResult } from "../types/DiffResult";
import type { DiffType } from "../types/DiffType";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

const route = useRoute();
const router = useRouter();
const documentStore = usePolicyDocumentStore();
const diffStore = useDiffResultStore();
const noteStore = useReviewNoteStore();

const oldId = ref(0);
const newId = ref(0);
const activeTypes = ref<DiffType[]>([...DEFAULT_DIFF_FILTER]);
const openDiffId = ref<number | null>(null);
const reviewer = useLocalStorageState<string>("reviewer-name", "法务-当前用户");

onMounted(async () => {
  await Promise.all([documentStore.load(), diffStore.load(), noteStore.load()]);
  const queryOld = Number(route.query.from);
  const queryNew = Number(route.query.to);
  if (queryOld && queryNew) {
    oldId.value = queryOld;
    newId.value = queryNew;
    await loadPair();
  } else {
    const docs = documentStore.sorted;
    if (docs.length >= 2) {
      oldId.value = docs[docs.length - 2].id;
      newId.value = docs[docs.length - 1].id;
      await loadPair();
    }
  }
});

watch([oldId, newId], async () => {
  if (oldId.value && newId.value) await loadPair();
});

const pairDiffs = computed(() =>
  diffStore.rows
    .filter((diff) => diff.old_document_id === oldId.value && diff.new_document_id === newId.value)
    .sort((a, b) => a.section_no.localeCompare(b.section_no, "zh-CN", { numeric: true }))
);

const visibleDiffs = computed(() => pairDiffs.value.filter((diff) => activeTypes.value.includes(diff.diff_type)));

const stats = computed(() => {
  const count = (type: DiffType) => pairDiffs.value.filter((diff) => diff.diff_type === type).length;
  return {
    added: count("ADDED"),
    removed: count("REMOVED"),
    modified: count("MODIFIED"),
    moved: count("MOVED"),
    unchanged: count("UNCHANGED"),
    open: pairDiffs.value.filter((diff) => diff.status === "OPEN").length
  };
});

async function loadPair() {
  if (oldId.value === newId.value) {
    ElMessage.warning("请选择两版不同的政策");
    return;
  }
  try {
    const pair = await diffStore.selectPair(oldId.value, newId.value);
    if (pair.length > 0) openDiffId.value = pair[0].id;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "对比生成失败");
  }
}

function onPairChange(payload: { oldId: number; newId: number }) {
  oldId.value = payload.oldId;
  newId.value = payload.newId;
  router.replace({ query: { from: payload.oldId, to: payload.newId } });
}

function toggleType(type: DiffType) {
  if (activeTypes.value.includes(type)) {
    activeTypes.value = activeTypes.value.filter((item) => item !== type);
  } else {
    activeTypes.value = [...activeTypes.value, type];
  }
}

function sectionOf(id: number | null) {
  return documentStore.sections.find((section) => section.id === id) ?? null;
}

function diffStatusText(diff: DiffResult): string {
  return ReviewStatusText[diff.status];
}

function toggleDiff(id: number) {
  openDiffId.value = openDiffId.value === id ? null : id;
}
</script>

<template>
  <div class="page-inner">
    <header class="page-title">
      <div>
        <p class="eyebrow">STEP 2 · COMPARE</p>
        <h2>版本对比</h2>
        <p class="subtitle">按条款逐段列出两版差异：新增、移除、改动、移动、未变化清晰区分；可直接在此确认改动或写下备注。</p>
      </div>
      <VersionPairSelector :documents="documentStore.sorted" :old-id="oldId" :new-id="newId" @change="onPairChange" />
    </header>

    <section class="metrics metrics-5">
      <StatCard label="新增" :value="stats.added" />
      <StatCard label="移除" :value="stats.removed" />
      <StatCard label="改动" :value="stats.modified" />
      <StatCard label="移动" :value="stats.moved" />
      <StatCard label="待处理" :value="stats.open" hint="未变化条款默认折叠" />
    </section>

    <section class="panel">
      <div class="filter-bar">
        <el-check-tag
          v-for="type in DIFF_FILTER_TYPES"
          :key="type"
          :checked="activeTypes.includes(type)"
          :class="`filter-tag filter-${type.toLowerCase()}`"
          @change="toggleType(type)"
        >{{ DiffTypeText[type] }}（{{ type === 'ADDED' ? stats.added : type === 'REMOVED' ? stats.removed : type === 'MODIFIED' ? stats.modified : type === 'MOVED' ? stats.moved : stats.unchanged }}）</el-check-tag>
      </div>

      <EmptyState
        v-if="pairDiffs.length === 0"
        title="尚未生成对比结果"
        description="请先在文档导入页导入两版政策，或在上方选择版本"
      />
      <EmptyState
        v-else-if="visibleDiffs.length === 0"
        title="当前筛选条件下没有差异条款"
      />

      <div v-else class="diff-list">
        <article
          v-for="diff in visibleDiffs"
          :id="`diff-${diff.id}`"
          :key="diff.id"
          class="diff-card"
          :class="[`card-${diff.diff_type.toLowerCase()}`, { open: openDiffId === diff.id, reopened: diff.status === 'OPEN' && noteStore.notesOf(diff.id).some((n) => n.inherited_from_note_id !== null) }]"
        >
          <header class="diff-card-head" @click="toggleDiff(diff.id)">
            <span class="diff-type-chip" :class="`chip-${diff.diff_type.toLowerCase()}`">{{ DiffTypeText[diff.diff_type] }}</span>
            <strong class="diff-section-no">{{ diff.section_no }}</strong>
            <span class="diff-heading">{{ diff.heading }}</span>
            <span class="diff-status-text">{{ diffStatusText(diff) }}</span>
            <span class="diff-caret">{{ openDiffId === diff.id ? "收起 ▴" : "展开 ▾" }}</span>
          </header>
          <el-collapse-transition>
            <div v-show="openDiffId === diff.id" class="diff-card-body">
              <p class="diff-summary">{{ diff.summary }}</p>
              <DiffViewer :diff="diff" :old-section="sectionOf(diff.old_section_id)" :new-section="sectionOf(diff.section_id)" />
              <ReviewChecklist :diff="diff" :notes="noteStore.notesOf(diff.id)" :reviewer="reviewer" />
              <div class="reviewer-row">
                <el-input v-model="reviewer" size="small" placeholder="审查员姓名（确认/备注时署名）" class="reviewer-input" />
              </div>
            </div>
          </el-collapse-transition>
        </article>
      </div>
    </section>
  </div>
</template>
