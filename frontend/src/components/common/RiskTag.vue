<script setup lang="ts">
import { computed } from "vue";
import { RISK_LEVEL_TEXT, RISK_LEVEL_TONE } from "../../constants/PrivacyRiskLevel";
import type { PrivacyRiskLevel } from "../../types/PrivacyRiskLevel";

const props = withDefaults(defineProps<{ level: string; size?: "sm" | "md" }>(), { size: "md" });

const risk = computed<PrivacyRiskLevel | null>(
  () => (props.level in RISK_LEVEL_TEXT ? (props.level as PrivacyRiskLevel) : null)
);
const tone = computed(() => (risk.value ? RISK_LEVEL_TONE[risk.value] : "#7a8074"));
const label = computed(() => (risk.value ? RISK_LEVEL_TEXT[risk.value] : props.level));
</script>

<template>
  <span class="risk-tag" :class="size" :style="{ background: `${tone}22`, color: tone, borderColor: tone }">
    <i class="dot" :style="{ background: tone }" />{{ label }}
  </span>
</template>
