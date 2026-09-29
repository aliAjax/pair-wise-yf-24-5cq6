<script setup lang="ts">
import { computed } from "vue";
import { PrivacyRiskLevelText, type PrivacyRiskLevel } from "../../constants/PrivacyRiskLevel";

const props = defineProps<{
  level: PrivacyRiskLevel | string;
  size?: "small" | "default";
}>();

const text = computed(() => PrivacyRiskLevelText[props.level as PrivacyRiskLevel] ?? props.level);
</script>

<template>
  <span class="risk-tag" :class="[`risk-${level}`, { small: size === 'small' }]">
    <span class="risk-dot" />{{ text }}
  </span>
</template>
