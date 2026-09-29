<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import RiskTag from "../components/common/RiskTag.vue";
import EmptyState from "../components/common/EmptyState.vue";
import StatCard from "../components/common/StatCard.vue";
import { SectionCategory, SectionCategoryText, type SectionCategory as SectionCategoryT } from "../constants/SectionCategory";
import { PrivacyRiskLevel, PrivacyRiskLevelText, type PrivacyRiskLevel as PrivacyRiskLevelT } from "../constants/PrivacyRiskLevel";
import { usePolicyDocumentStore } from "../stores/PolicyDocumentStore";
import { usePolicySectionStore } from "../stores/PolicySectionStore";
import { riskRank } from "../utils/formatters";

const documentStore = usePolicyDocumentStore();
const sectionStore = usePolicySectionStore();

const selectedDocId = ref<number>(0);
const categoryFilter = ref<SectionCategoryT | "ALL">("ALL");
const onlyNew = ref(false);
const savingId = ref<number | null>(null);

onMounted(async () => {
  await Promise.all([documentStore.load(), sectionStore.load()]);
  if (documentStore.latest) selectedDocId.value = documentStore.latest.id;
});

const sections = computed(() =>
  sectionStore.rows
    .filter((section) => section.document_id === selectedDocId.value)
    .filter((section) => (categoryFilter.value === "ALL" ? true : section.category === categoryFilter.value))
    .filter((section) => (onlyNew.value ? section.is_newly_added : true))
    .sort((a, b) => riskRank(b.risk_level) - riskRank(a.risk_level) || a.section_no.localeCompare(b.section_no, "zh-CN", { numeric: true }))
);

const riskStats = computed(() => ({
  critical: sections.value.filter((s) => s.risk_level === "CRITICAL").length,
  high: sections.value.filter((s) => s.risk_level === "HIGH").length,
  newCount: documentStore.sections.filter((s) => s.document_id === selectedDocId.value && s.is_newly_added).length
}));

async function saveAnnotation(sectionId: number, patch: { category?: SectionCategoryT; risk_level?: PrivacyRiskLevelT }) {
  savingId.value = sectionId;
  try {
    await sectionStore.annotate(sectionId, patch);
    ElMessage.success("风险标注已保存");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存失败");
  } finally {
    savingId.value = null;
  }
}

const riskColor: Record<PrivacyRiskLevelT, string> = {
  LOW: "info",
  MEDIUM: "",
  HIGH: "warning",
  CRITICAL: "danger"
};
</script>

<template>
  <div class="page-inner">
    <header class="page-title">
      <div>
        <p class="eyebrow">STEP 3 · RISK</p>
        <h2>风险标注</h2>
        <p class="subtitle">新出现条款已按关键词自动归类到数据收集、信息共享、保存期限等类别并标出风险高低；法务可逐条复核覆盖。</p>
      </div>
      <el-select v-model="selectedDocId" placeholder="选择政策版本" style="width: 260px">
        <el-option
          v-for="doc in documentStore.sorted"
          :key="doc.id"
          :label="`${doc.version_label} · ${doc.title}`"
          :value="doc.id"
        />
      </el-select>
    </header>

    <section class="metrics metrics-3">
      <StatCard label="严重风险条款" :value="riskStats.critical" />
      <StatCard label="高风险条款" :value="riskStats.high" />
      <StatCard label="本版新增条款" :value="riskStats.newCount" hint="自动按数据收集/共享/保存期限初判" />
    </section>

    <section class="panel">
      <div class="filter-bar">
        <el-radio-group v-model="categoryFilter" size="small">
          <el-radio-button label="ALL">全部类别</el-radio-button>
          <el-radio-button v-for="category in SectionCategory" :key="category" :label="category">
            {{ SectionCategoryText[category] }}
          </el-radio-button>
        </el-radio-group>
        <el-checkbox v-model="onlyNew" border>仅看本版新增条款</el-checkbox>
      </div>

      <EmptyState v-if="sections.length === 0" title="该筛选条件下没有条款" />

      <ul v-else class="risk-list">
        <li v-for="section in sections" :key="section.id" class="risk-row" :class="`risk-bg-${section.risk_level.toLowerCase()}`">
          <div class="risk-row-main">
            <div class="risk-row-title">
              <span class="section-no">{{ section.section_no }}</span>
              <strong>{{ section.heading }}</strong>
              <el-tag v-if="section.is_newly_added" type="danger" size="small" effect="dark">新增</el-tag>
            </div>
            <p class="risk-row-content">{{ section.content }}</p>
          </div>
          <div class="risk-row-ops">
            <RiskTag :level="section.risk_level" />
            <el-select
              :model-value="section.category"
              size="small"
              class="risk-select"
              @update:model-value="(value: SectionCategoryT) => saveAnnotation(section.id, { category: value })"
            >
              <el-option v-for="category in SectionCategory" :key="category" :label="SectionCategoryText[category]" :value="category" />
            </el-select>
            <el-select
              :model-value="section.risk_level"
              size="small"
              class="risk-select"
              :loading="savingId === section.id"
              @update:model-value="(value: PrivacyRiskLevelT) => saveAnnotation(section.id, { risk_level: value })"
            >
              <el-option
                v-for="level in PrivacyRiskLevel"
                :key="level"
                :label="PrivacyRiskLevelText[level]"
                :value="level"
              >
                <el-tag size="small" :type="riskColor[level]">{{ PrivacyRiskLevelText[level] }}</el-tag>
              </el-option>
            </el-select>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
