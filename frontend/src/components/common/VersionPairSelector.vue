<script setup lang="ts">
import { computed } from "vue";
import type { PolicyDocument } from "../../types/PolicyDocument";

const props = defineProps<{
  documents: PolicyDocument[];
  oldId: number;
  newId: number;
}>();

const emit = defineEmits<{
  (event: "change", payload: { oldId: number; newId: number }): void;
}>();

/** 版本按导入时间升序排列，新版默认取最新、旧版取倒数第二版 */
const sorted = computed(() => [...props.documents].sort((a, b) => a.imported_at.localeCompare(b.imported_at)));

function update(patch: Partial<{ oldId: number; newId: number }>) {
  emit("change", { oldId: props.oldId, newId: props.newId, ...patch });
}
</script>

<template>
  <div class="pair-selector">
    <el-select
      :model-value="oldId"
      placeholder="选择旧版本"
      class="pair-select"
      @update:model-value="(value: number) => update({ oldId: value })"
    >
      <el-option
        v-for="doc in sorted"
        :key="doc.id"
        :label="`${doc.version_label} · ${doc.title}`"
        :value="doc.id"
      />
    </el-select>
    <span class="pair-arrow">→</span>
    <el-select
      :model-value="newId"
      placeholder="选择新版本"
      class="pair-select"
      @update:model-value="(value: number) => update({ newId: value })"
    >
      <el-option
        v-for="doc in sorted"
        :key="doc.id"
        :label="`${doc.version_label} · ${doc.title}`"
        :value="doc.id"
      />
    </el-select>
  </div>
</template>
