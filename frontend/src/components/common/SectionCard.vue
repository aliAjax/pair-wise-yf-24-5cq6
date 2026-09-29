<script setup lang="ts">
import { computed } from "vue";
import type { PolicySection } from "../../types/PolicySection";
import { SectionCategoryText } from "../../constants/SectionCategory";
import RiskTag from "./RiskTag.vue";

const props = defineProps<{
  section: PolicySection;
  highlight?: boolean;
  extra?: string;
}>();

const categoryText = computed(() => SectionCategoryText[props.section.category] ?? props.section.category);
</script>

<template>
  <article class="section-card" :class="{ highlight }">
    <header class="section-card-head">
      <div class="section-title">
        <span class="section-no">{{ section.section_no }}</span>
        <strong>{{ section.heading }}</strong>
        <el-tag v-if="section.is_newly_added" type="danger" size="small" effect="dark">新增条款</el-tag>
      </div>
      <div class="section-meta">
        <el-tag size="small" effect="plain">{{ categoryText }}</el-tag>
        <RiskTag :level="section.risk_level" size="small" />
      </div>
    </header>
    <p class="section-content">{{ section.content }}</p>
    <footer v-if="extra" class="section-extra">{{ extra }}</footer>
  </article>
</template>
