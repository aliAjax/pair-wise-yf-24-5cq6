<script setup lang="ts">
import { computed } from "vue";
import { DIFF_TYPE_TEXT } from "../../constants/DiffType";
import { REVIEW_STATUS_TEXT } from "../../constants/ReviewStatus";
import { SECTION_CATEGORY_TEXT } from "../../constants/SectionCategory";

const props = withDefaults(
  defineProps<{ value: string; kind?: "review" | "diff" | "category" | "raw" }>(),
  { kind: "raw" }
);

const text = computed(() => {
  if (props.kind === "review") return REVIEW_STATUS_TEXT[props.value as keyof typeof REVIEW_STATUS_TEXT] ?? props.value;
  if (props.kind === "diff") return DIFF_TYPE_TEXT[props.value as keyof typeof DIFF_TYPE_TEXT] ?? props.value;
  if (props.kind === "category")
    return SECTION_CATEGORY_TEXT[props.value as keyof typeof SECTION_CATEGORY_TEXT] ?? props.value;
  return props.value.replace(/_/g, " ");
});
</script>

<template>
  <span class="badge" :class="['badge-' + kind, 'tone-' + value]">{{ text }}</span>
</template>
