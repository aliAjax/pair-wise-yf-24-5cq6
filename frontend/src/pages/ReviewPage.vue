<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { usePolicyDocumentStore } from "../stores/PolicyDocumentStore";
import { useDiffResultStore } from "../stores/DiffResultStore";
import { useReviewNoteStore } from "../stores/ReviewNoteStore";
import { REVIEW_STATUS_FILTERS, REVIEW_STATUS_TEXT } from "../constants/ReviewStatus";
import { DIFF_TYPE_TEXT } from "../constants/DiffType";
import type { ReviewStatus } from "../types/ReviewStatus";
import type { DiffResult } from "../types/DiffResult";
import ReviewChecklist from "../components/common/ReviewChecklist.vue";
import DiffViewer from "../components/common/DiffViewer.vue";
import RiskTag from "../components/common/RiskTag.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import EmptyState from "../components/common/EmptyState.vue";
import StatCard from "../components/common/StatCard.vue";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { buildReviewMarkdown, downloadMarkdown } from "../services/exportMarkdown";
import { logAction } from "../utils/logger";
import { resolveErrorMessage } from "../utils/errors";

const route = useRoute();
const documentStore = usePolicyDocumentStore();
const diffStore = useDiffResultStore();
const reviewStore = useReviewNoteStore();

const { state: prefs, persist } = useLocalStorageState("reviewPrefs", { reviewer: "" });
const reviewer = ref(prefs.value.reviewer);
const syncReviewer = () => persist({ reviewer: reviewer.value });

const oldId = ref<number | null>(null);
const newId = ref<number | null>(null);
const activeStatuses = ref<ReviewStatus[]>(["OPEN", "CONFIRMED", "IGNORED", "RESOLVED"]);
const onlyReopened = ref(false);
const focusKey = ref<string | null>(null);
const feedback = ref("");
const feedbackKind = ref<"success" | "error">("success");

const documents = computed(() => documentStore.sortedByImported);
const oldDocument = computed(() => documentStore.getById(oldId.value));
const newDocument = computed(() => documentStore.getById(newId.value));

const pairDiffs = computed<DiffResult[]>(() =>
  oldId.value === null || newId.value === null
    ? []
    : diffStore.diffsByPair(oldId.value, newId.value)
);

/** 差异重新生成后，曾已确认但条款内容又变过的结论会带 reopened=true 退回待处理 */
const reopenedKeys = computed<Set<string>>(() => {
  const keys = new Set<string>();
  pairDiffs.value.forEach((diff) => {
    if (reviewStore.notesByDiff(diff.id).some((note) => note.reopened)) {
      keys.add(diff.match_key);
    }
  });
  return keys;
});

const statusOf = (diff: DiffResult): ReviewStatus =>
  reviewStore.latestByDiff.get(diff.id)?.status ?? "OPEN";

const decoratedDiffs = computed(() =>
  [...pairDiffs.value]
    .sort((a, b) => {
      const order: Record<DiffResult["diff_type"], number> = { ADDED: 0, MODIFIED: 1, REMOVED: 2, MOVED: 3, UNCHANGED: 4 };
      const statusWeight: Record<ReviewStatus, number> = { OPEN: 0, CONFIRMED: 2, RESOLVED: 1, IGNORED: 3 };
      const aReopen = reopenedKeys.value.has(a.match_key) ? 0 : 1;
      const bReopen = reopenedKeys.value.has(b.match_key) ? 0 : 1;
      if (aReopen !== bReopen) return aReopen - bReopen;
      if (statusWeight[statusOf(a)] !== statusWeight[statusOf(b)]) {
        return statusWeight[statusOf(a)] - statusWeight[statusOf(b)];
      }
      if (order[a.diff_type] !== order[b.diff_type]) return order[a.diff_type] - order[b.diff_type];
      return a.match_key.localeCompare(b.match_key, "zh-CN-u-kn-true");
    })
    .filter((diff) => activeStatuses.value.includes(statusOf(diff)))
    .filter((diff) => (onlyReopened.value ? reopenedKeys.value.has(diff.match_key) : true))
);

const stats = computed(() => ({
  open: pairDiffs.value.filter((diff) => statusOf(diff) === "OPEN").length,
  confirmed: pairDiffs.value.filter((diff) => statusOf(diff) === "CONFIRMED").length,
  ignored: pairDiffs.value.filter((diff) => statusOf(diff) === "IGNORED").length,
  reopened: reopenedKeys.value.size
}));

const oldSectionOf = (diff: DiffResult) =>
  (oldId.value === null ? [] : documentStore.sectionsOf(oldId.value)).find((section) => section.id === diff.old_section_id) ?? null;
const newSectionOf = (diff: DiffResult) =>
  (newId.value === null ? [] : documentStore.sectionsOf(newId.value)).find((section) => section.id === diff.new_section_id) ?? null;

const toggleStatus = (status: ReviewStatus) => {
  activeStatuses.value = activeStatuses.value.includes(status)
    ? activeStatuses.value.filter((item) => item !== status)
    : [...activeStatuses.value, status];
};

const onAddNote = async (payload: {
  diffResultId: number;
  tag: string;
  comment: string;
  reviewer: string;
  status: ReviewStatus;
}) => {
  feedback.value = "";
  try {
    await reviewStore.addNote(payload);
    feedbackKind.value = "success";
    feedback.value =
      payload.status === "CONFIRMED" ? "已确认该条改动，结论绑定当前条款内容。" : "审阅备注已保存。";
    ElMessage.success(payload.status === "CONFIRMED" ? "已确认该条改动" : "审阅备注已保存");
  } catch (error) {
    feedbackKind.value = "error";
    feedback.value = resolveErrorMessage(error);
    ElMessage.error(feedback.value);
  }
};

const onStatusChange = async (payload: { noteId: number; status: ReviewStatus }) => {
  await reviewStore.setStatus(payload.noteId, payload.status);
};

const exportMarkdown = () => {
  if (!oldDocument.value || !newDocument.value) return;
  const content = buildReviewMarkdown({
    oldDocument: oldDocument.value,
    newDocument: newDocument.value,
    diffs: pairDiffs.value,
    notes: reviewStore.rows.filter((note) =>
      pairDiffs.value.some((diff) => diff.id === note.diff_result_id)
    ),
    oldSections: oldId.value === null ? [] : documentStore.sectionsOf(oldId.value),
    newSections: newId.value === null ? [] : documentStore.sectionsOf(newId.value)
  });
  downloadMarkdown(
    `审阅摘要-${newDocument.value.title}-${newDocument.value.version_label}.md`,
    content
  );
  logAction("ReviewNote", "EXPORT", { noteCount: reviewStore.rows.length });
  ElMessage.success("Markdown 摘要已导出");
};

onMounted(async () => {
  await Promise.all([documentStore.load(), diffStore.load(), reviewStore.load()]);
  const docs = documentStore.sortedByImported;
  oldId.value = route.query.old ? Number(route.query.old) : docs[0]?.id ?? null;
  newId.value = route.query.new ? Number(route.query.new) : docs[1]?.id ?? null;
  focusKey.value = typeof route.query.focus === "string" ? route.query.focus : null;
});

const expandedKey = ref<string | null>(null);
const toggleExpand = (key: string) => {
  expandedKey.value = expandedKey.value === key ? null : key;
  focusKey.value = null;
};

// 从对比页“去审阅”带 focus 跳转时，自动展开并滚动定位
const focusTarget = async (key: string) => {
  expandedKey.value = key;
  await nextTick();
  document.getElementById(`review-${key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
};

watch(focusKey, (key) => {
  if (key) void focusTarget(key);
});
</script>

<template>
  <section class="review-page">
    <div class="panel review-picker">
      <div class="picker-fields">
        <label>
          <span>旧版本</span>
          <select v-model="oldId">
            <option v-for="doc in documents" :key="doc.id" :value="doc.id">{{ doc.version_label }} — {{ doc.title }}</option>
          </select>
        </label>
        <span class="picker-arrow">→</span>
        <label>
          <span>新版本</span>
          <select v-model="newId">
            <option v-for="doc in documents" :key="doc.id" :value="doc.id">{{ doc.version_label }} — {{ doc.title }}</option>
          </select>
        </label>
        <label class="reviewer-field">
          <span>审阅人</span>
          <input v-model="reviewer" type="text" placeholder="姓名 / 工号" @blur="syncReviewer" />
        </label>
        <button class="btn primary" :disabled="pairDiffs.length === 0" @click="exportMarkdown">导出 Markdown 摘要</button>
      </div>
    </div>

    <p v-if="feedback" class="inline-feedback" :class="feedbackKind">{{ feedback }}</p>

    <div v-if="pairDiffs.length > 0" class="metrics four">
      <StatCard label="待处理" :value="stats.open" />
      <StatCard label="已确认" :value="stats.confirmed" />
      <StatCard label="已忽略" :value="stats.ignored" />
      <StatCard label="内容再变被退回" :value="stats.reopened" />
    </div>

    <div v-if="pairDiffs.length > 0" class="panel filter-bar">
      <div class="filter-group">
        <span class="filter-label">审阅状态</span>
        <button
          v-for="status in REVIEW_STATUS_FILTERS"
          :key="status"
          class="chip"
          :class="{ off: !activeStatuses.includes(status) }"
          @click="toggleStatus(status)"
        >
          {{ REVIEW_STATUS_TEXT[status] }}
        </button>
      </div>
      <label class="reopen-toggle">
        <input v-model="onlyReopened" type="checkbox" /> 只看确认后被退回的条款
      </label>
    </div>

    <EmptyState v-if="oldId === null || newId === null" title="请先导入两个政策版本" />
    <EmptyState
      v-else-if="pairDiffs.length === 0"
      title="这两个版本还没有对比结果"
      hint="请先到「版本对比」页生成差异"
    />
    <EmptyState v-else-if="decoratedDiffs.length === 0" title="当前状态筛选下没有待办" />

    <div v-else class="review-list">
      <article
        v-for="diff in decoratedDiffs"
        :id="`review-${diff.match_key}`"
        :key="diff.id"
        class="review-entry panel"
        :class="{ focus: focusKey === diff.match_key, reopen: reopenedKeys.has(diff.match_key) }"
      >
        <header class="review-head" @click="toggleExpand(diff.match_key)">
          <StatusBadge kind="diff" :value="diff.diff_type" />
          <span class="diff-section-no">{{ (newSectionOf(diff) ?? oldSectionOf(diff))?.section_no }}</span>
          <strong>{{ (newSectionOf(diff) ?? oldSectionOf(diff))?.heading }}</strong>
          <RiskTag :level="diff.risk_level" />
          <StatusBadge kind="review" :value="statusOf(diff)" />
          <span class="review-summary">{{ diff.summary }}</span>
          <span class="expand-mark">{{ expandedKey === diff.match_key ? "收起 ▲" : "审阅 ▼" }}</span>
        </header>

        <div v-if="expandedKey === diff.match_key || focusKey === diff.match_key" class="review-body">
          <DiffViewer
            :old-content="oldSectionOf(diff)?.content ?? ''"
            :new-content="newSectionOf(diff)?.content ?? ''"
          />
          <ReviewChecklist
            :diff="diff"
            :notes="reviewStore.notesByDiff(diff.id)"
            :reviewer="reviewer"
            :reopened="reopenedKeys.has(diff.match_key)"
            @add="onAddNote"
            @status="onStatusChange"
          />
        </div>
        <p v-if="diff.diff_type === 'ADDED'" class="side-note">新出现条款，已按「{{ DIFF_TYPE_TEXT[diff.diff_type] }}」规则初判风险：<RiskTag :level="diff.risk_level" size="sm" /></p>
      </article>
    </div>
  </section>
</template>
