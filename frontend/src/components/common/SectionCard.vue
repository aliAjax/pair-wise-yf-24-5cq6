<script setup lang="ts">
import { computed } from "vue";
import type { PolicySection } from "../../types/PolicySection";
import { SECTION_CATEGORY_TEXT } from "../../constants/SectionCategory";
import RiskTag from "./RiskTag.vue";

const props = withDefaults(
  defineProps<{
    section: PolicySection;
    extraNo?: string;
    selectable?: boolean;
    selected?: boolean;
    highlightRisk?: boolean;
  }>(),
  { extraNo: "", selectable: false, selected: false, highlightRisk: false }
);

const emit = defineEmits<{ (event: "select", section: PolicySection): void }>();

const categoryText = computed(() => SECTION_CATEGORY_TEXT[props.section.category] ?? props.section.category);
const contentRows = computed(() => props.section.content.split("\n").filter((line) => line.trim()));
</script>

<template>
  <article
    class="section-card"
    :class="{ clickable: selectable, selected, 'risk-flash': highlightRisk && section.risk_level !== 'LOW' }"
    @click="selectable && emit('select', section)"
  >
    <header class="section-head">
      <span class="section-no">{{ extraNo || section.section_no }}</span>
      <strong class="section-title">{{ section.heading }}</strong>
      <span class="section-category">{{ categoryText }}</span>
      <RiskTag :level="section.risk_level" />
    </header>
    <div class="section-body">
      <p v-for="(line, index) in contentRows" :key="index">{{ line }}</p>
    </div>
    <slot />
  </article>
</template>
