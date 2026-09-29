<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useTextDiff, type DiffLine } from "../../hooks/useTextDiff";
import StatusBadge from "./StatusBadge.vue";

const props = withDefaults(
  defineProps<{
    oldContent?: string;
    newContent?: string;
    lines?: DiffLine[];
    compact?: boolean;
  }>(),
  { oldContent: "", newContent: "", compact: false }
);

const inline = useTextDiff();
watchEffect(() => {
  inline.oldContent.value = props.oldContent ?? "";
  inline.newContent.value = props.newContent ?? "";
});

const diffLines = computed<DiffLine[]>(() => props.lines ?? inline.lines.value);

const stats = computed(() => ({
  added: diffLines.value.filter((line) => line.kind === "ADDED_LINE").length,
  removed: diffLines.value.filter((line) => line.kind === "REMOVED_LINE").length
}));

const renderSegments = (line: DiffLine) =>
  line.segments.length === 0 ? [{ kind: "EQUAL", text: line.text }] : line.segments;
</script>

<template>
  <div class="diff-viewer" :class="{ compact }">
    <div v-if="!compact" class="diff-meta">
      <StatusBadge kind="diff" value="MODIFIED" />
      <span>新增 {{ stats.added }} 行 · 删除 {{ stats.removed }} 行</span>
    </div>
    <div class="diff-body">
      <template v-if="diffLines.length === 0">
        <div class="diff-line context">两段文本完全一致</div>
      </template>
      <div v-for="(line, index) in diffLines" :key="index" class="diff-line" :class="line.kind.toLowerCase()">
        <span class="diff-gutter">{{ line.oldLineNo ?? "" }}</span>
        <span class="diff-gutter">{{ line.newLineNo ?? "" }}</span>
        <span class="diff-prefix">{{ line.kind === "ADDED_LINE" ? "+" : line.kind === "REMOVED_LINE" ? "-" : " " }}</span>
        <span class="diff-text">
          <template v-for="(segment, segIndex) in renderSegments(line)" :key="segIndex">
            <mark :class="segment.kind.toLowerCase()">{{ segment.text }}</mark>
          </template>
        </span>
      </div>
    </div>
  </div>
</template>
