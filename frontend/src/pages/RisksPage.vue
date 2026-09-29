<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { usePolicyDocumentStore } from "../stores/PolicyDocumentStore";
import { usePolicySectionStore } from "../stores/PolicySectionStore";
import {
  SECTION_CATEGORIES,
  SECTION_CATEGORY_TEXT,
  NEW_SECTION_RISK_RULE
} from "../constants/SectionCategory";
import { RISK_LEVEL_FILTERS, RISK_LEVEL_TEXT } from "../constants/PrivacyRiskLevel";
import type { SectionCategory } from "../types/SectionCategory";
import type { PrivacyRiskLevel } from "../types/PrivacyRiskLevel";
import RiskTag from "../components/common/RiskTag.vue";
import EmptyState from "../components/common/EmptyState.vue";
import StatCard from "../components/common/StatCard.vue";
import type { PolicySection } from "../types/PolicySection";

const documentStore = usePolicyDocumentStore();
const sectionStore = usePolicySectionStore();

const documentId = ref<number | null>(null);
const activeCategories = ref<SectionCategory[]>([
  "DATA_COLLECTION",
  "INFORMATION_SHARING",
  "RETENTION"
]);
const activeRisks = ref<PrivacyRiskLevel[]>([]);
const keyword = ref("");

onMounted(async () => {
  await Promise.all([documentStore.load(), sectionStore.load()]);
  documentId.value = documentStore.sortedByImported[documentStore.sortedByImported.length - 1]?.id ?? null;
});

const documents = computed(() => documentStore.sortedByImported);
const sections = computed(() => (documentId.value === null ? [] : documentStore.sectionsOf(documentId.value)));

const focusCategories: SectionCategory[] = ["DATA_COLLECTION", "INFORMATION_SHARING", "RETENTION"];

const filtered = computed(() =>
  sections.value
    .filter((section) => activeCategories.value.includes(section.category))
    .filter((section) => activeRisks.value.length === 0 || activeRisks.value.includes(section.risk_level))
    .filter((section) =>
      keyword.value.trim()
        ? `${section.heading}${section.content}`.includes(keyword.value.trim())
        : true
    )
);

const riskCounts = computed(() => {
  const counts: Record<PrivacyRiskLevel, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  sections.value.forEach((section) => {
    if (focusCategories.includes(section.category)) counts[section.risk_level] += 1;
  });
  return counts;
});

const toggleCategory = (category: SectionCategory) => {
  activeCategories.value = activeCategories.value.includes(category)
    ? activeCategories.value.filter((item) => item !== category)
    : [...activeCategories.value, category];
};

const toggleRisk = (level: PrivacyRiskLevel) => {
  activeRisks.value = activeRisks.value.includes(level)
    ? activeRisks.value.filter((item) => item !== level)
    : [...activeRisks.value, level];
};

const updateSection = async (section: PolicySection, patch: Partial<Pick<PolicySection, "category" | "risk_level">>) => {
  const nextCategory = patch.category ?? section.category;
  const nextRisk = patch.risk_level ?? section.risk_level;
  await sectionStore.reclassify(section.id, nextCategory, nextRisk);
  // 同步文档 store 中缓存的条款副本，保证两页数据一致
  const cached = documentStore.sections.find((item) => item.id === section.id);
  if (cached) {
    cached.category = nextCategory;
    cached.risk_level = nextRisk;
  }
};

const applySuggestedRisk = (section: PolicySection) => {
  void updateSection(section, { category: section.category, risk_level: NEW_SECTION_RISK_RULE[section.category] });
};

const previewOf = (section: PolicySection) =>
  section.content.length > 120 ? `${section.content.slice(0, 120)}…` : section.content;
</script>

<template>
  <section class="risks-page">
    <div class="panel version-bar">
      <label>
        <span>审阅版本</span>
        <select v-model="documentId">
          <option v-for="doc in documents" :key="doc.id" :value="doc.id">
            {{ doc.version_label }} — {{ doc.title }}
          </option>
        </select>
      </label>
      <p class="panel-hint">
        新导入条款会自动识别「数据收集 / 信息共享 / 保存期限」并给出风险初判，法务可在此逐条改判。
      </p>
    </div>

    <div class="metrics four">
      <StatCard label="重点条款" :value="sections.filter((s) => focusCategories.includes(s.category)).length" />
      <StatCard label="高风险" :value="riskCounts.HIGH" />
      <StatCard label="严重风险" :value="riskCounts.CRITICAL" />
      <StatCard label="中风险" :value="riskCounts.MEDIUM" />
    </div>

    <div class="panel filter-bar">
      <div class="filter-group">
        <span class="filter-label">条款类别</span>
        <button
          v-for="category in SECTION_CATEGORIES"
          :key="category"
          class="chip"
          :class="{ off: !activeCategories.includes(category) }"
          @click="toggleCategory(category)"
        >
          {{ SECTION_CATEGORY_TEXT[category] }}
        </button>
      </div>
      <div class="filter-group">
        <span class="filter-label">风险等级</span>
        <button
          v-for="level in RISK_LEVEL_FILTERS"
          :key="level"
          class="chip"
          :class="{ off: !activeRisks.includes(level) }"
          @click="toggleRisk(level)"
        >
          {{ RISK_LEVEL_TEXT[level] }}
        </button>
      </div>
      <input v-model="keyword" class="filter-search" type="text" placeholder="搜索条款标题或正文" />
    </div>

    <EmptyState v-if="documentId === null" title="还没有可标注的版本" hint="请先到文档导入页粘贴政策" />
    <EmptyState v-else-if="filtered.length === 0" title="没有符合筛选条件的条款" />

    <div v-else class="risk-grid">
      <article v-for="section in filtered" :key="section.id" class="risk-card panel">
        <header>
          <span class="section-no">{{ section.section_no }}</span>
          <strong>{{ section.heading }}</strong>
          <RiskTag :level="section.risk_level" />
        </header>
        <p class="risk-content">{{ previewOf(section) }}</p>
        <div class="risk-controls">
          <label>
            <span>分类</span>
            <select
              :value="section.category"
              @change="updateSection(section, { category: ($event.target as HTMLSelectElement).value as SectionCategory })"
            >
              <option v-for="category in SECTION_CATEGORIES" :key="category" :value="category">
                {{ SECTION_CATEGORY_TEXT[category] }}
              </option>
            </select>
          </label>
          <label>
            <span>风险等级</span>
            <select
              :value="section.risk_level"
              @change="updateSection(section, { risk_level: ($event.target as HTMLSelectElement).value as PrivacyRiskLevel })"
            >
              <option v-for="level in RISK_LEVEL_FILTERS" :key="level" :value="level">
                {{ RISK_LEVEL_TEXT[level] }}
              </option>
            </select>
          </label>
          <button class="btn mini ghost" @click="applySuggestedRisk(section)">恢复规则初判</button>
        </div>
      </article>
    </div>
  </section>
</template>
