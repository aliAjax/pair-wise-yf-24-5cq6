<script setup lang="ts">
import { computed } from "vue";
import type { DiffResult } from "../../types/DiffResult";
import type { PolicySection } from "../../types/PolicySection";
import { useTextDiff } from "../../hooks/useTextDiff";
import RiskTag from "./RiskTag.vue";
import StatusBadge from "./StatusBadge.vue";

const props = defineProps<{
  diff: DiffResult;
  oldSection?: PolicySection | null;
  newSection?: PolicySection | null;
}>();

const { oldSegments, newSegments, addedChars, removedChars } = useTextDiff(
  () => props.oldSection?.content ?? "",
  () => props.newSection?.content ?? ""
);

const showWordDiff = computed(
  () => props.diff.diff_type === "MODIFIED" && Boolean(props.oldSection) && Boolean(props.newSection)
);
const typeTagType: Record<string, string> = {
  ADDED: "success",
  REMOVED: "danger",
  MODIFIED: "warning",
  MOVED: "info",
  UNCHANGED: ""
};
</script>

<template>
  <div class="diff-viewer">
    <div class="diff-col">
      <div class="diff-col-head">
        <span>旧版条款</span>
        <small v-if="oldSection">{{ oldSection.section_no }} {{ oldSection.heading }}</small>
        <small v-else class="muted">无对应条款</small>
      </div>
      <div class="diff-pane pane-old">
        <template v-if="showWordDiff">
          <span v-for="(seg, i) in oldSegments" :key="`o${i}`" :class="`tok tok-${seg.type}`">{{ seg.text }}</span>
        </template>
        <template v-else-if="oldSection">
          <span :class="{ 'tok-removed': diff.diff_type === 'REMOVED' }">{{ oldSection.content }}</span>
        </template>
        <span v-else class="muted">—</span>
      </div>
    </div>
    <div class="diff-arrow">
      <el-tag :type="typeTagType[diff.diff_type]" effect="dark">
        <StatusBadge kind="diff" :value="diff.diff_type" />
      </el-tag>
    </div>
    <div class="diff-col">
      <div class="diff-col-head">
        <span>新版条款</span>
        <small v-if="newSection">{{ newSection.section_no }} {{ newSection.heading }}</small>
        <small v-else class="muted">该条款已被移除</small>
        <RiskTag v-if="newSection" :level="diff.risk_level" size="small" />
      </div>
      <div class="diff-pane pane-new">
        <template v-if="showWordDiff">
          <span v-for="(seg, i) in newSegments" :key="`n${i}`" :class="`tok tok-${seg.type}`">{{ seg.text }}</span>
        </template>
        <template v-else-if="newSection">
          <span :class="{ 'tok-added': diff.diff_type === 'ADDED' }">{{ newSection.content }}</span>
        </template>
        <span v-else class="muted">—</span>
      </div>
    </div>
    <div v-if="showWordDiff" class="diff-foot">
      行内逐字对比：新增 {{ addedChars }} 字 · 删除 {{ removedChars }} 字
    </div>
  </div>
</template>
