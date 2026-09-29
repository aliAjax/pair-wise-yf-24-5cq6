<script setup lang="ts">
import { computed } from "vue";
import { ReviewStatusText, type ReviewStatus } from "../../constants/ReviewStatus";
import { DiffTypeText, type DiffType } from "../../constants/DiffType";

const props = defineProps<{
  kind?: "review" | "diff" | "raw";
  value: string;
}>();

const className = computed(() => ({ review: "review", diff: "diff", raw: "raw" }[props.kind ?? "raw"]));
const text = computed(() => {
  if (props.kind === "review") return ReviewStatusText[props.value as ReviewStatus] ?? props.value;
  if (props.kind === "diff") return DiffTypeText[props.value as DiffType] ?? props.value;
  return props.value.replace(/_/g, " ");
});
</script>

<template>
  <span class="badge" :class="[className, `v-${value.toLowerCase()}`]">{{ text }}</span>
</template>
