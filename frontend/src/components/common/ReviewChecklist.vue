<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import type { DiffResult } from "../../types/DiffResult";
import type { ReviewNote } from "../../types/ReviewNote";
import { REVIEW_NOTE_TAGS } from "../../constants/riskRules";
import { ReviewStatusText } from "../../constants/ReviewStatus";
import { useDiffResultStore } from "../../stores/DiffResultStore";
import { useReviewNoteStore } from "../../stores/ReviewNoteStore";
import StatusBadge from "./StatusBadge.vue";

const props = defineProps<{
  diff: DiffResult;
  notes: ReviewNote[];
  reviewer: string;
}>();

const diffStore = useDiffResultStore();
const noteStore = useReviewNoteStore();

const comment = ref("");
const tag = ref<string>(REVIEW_NOTE_TAGS[0]);
const busy = ref(false);

const invalidated = computed(
  () => props.diff.status === "OPEN" && props.notes.some((note) => note.inherited_from_note_id !== null)
);

async function changeStatus(status: DiffResult["status"]) {
  busy.value = true;
  try {
    await diffStore.setStatus(props.diff.id, status, props.reviewer);
    ElMessage.success(`已标记为「${ReviewStatusText[status]}」`);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "状态更新失败");
  } finally {
    busy.value = false;
  }
}

async function addNote() {
  if (!comment.value.trim()) {
    ElMessage.warning("请先填写备注内容");
    return;
  }
  busy.value = true;
  try {
    await noteStore.add({
      diff_result_id: props.diff.id,
      tag: tag.value,
      comment: comment.value,
      reviewer: props.reviewer
    });
    comment.value = "";
  } finally {
    busy.value = false;
  }
}

async function removeNote(noteId: number) {
  await noteStore.remove(noteId);
  ElMessage.success("备注已删除");
}
</script>

<template>
  <div class="review-checklist">
    <div v-if="invalidated" class="invalidate-tip">
      ⚠ 该条款内容在新版本中已变化，之前的确认已退回待处理；历史备注原文保留并标注“沿用上一版”。
    </div>

    <div class="checklist-status">
      <span class="muted">当前结论：</span>
      <StatusBadge kind="review" :value="diff.status" />
      <span v-if="diff.reviewer" class="muted">审查员：{{ diff.reviewer }}</span>
      <div class="checklist-actions">
        <el-button
          size="small"
          :type="diff.status === 'CONFIRMED' ? 'success' : 'default'"
          :loading="busy"
          @click="changeStatus('CONFIRMED')"
        >确认改动</el-button>
        <el-button size="small" :disabled="diff.status === 'IGNORED'" @click="changeStatus('IGNORED')">忽略</el-button>
        <el-button size="small" :disabled="diff.status === 'RESOLVED'" @click="changeStatus('RESOLVED')">无需处理</el-button>
        <el-button size="small" plain :disabled="diff.status === 'OPEN'" @click="changeStatus('OPEN')">退回待处理</el-button>
      </div>
    </div>

    <ul v-if="notes.length > 0" class="note-list">
      <li v-for="note in notes" :key="note.id" class="note-item">
        <div class="note-head">
          <el-tag size="small" effect="plain">{{ note.tag }}</el-tag>
          <strong>{{ note.reviewer }}</strong>
          <el-tag v-if="note.inherited_from_note_id !== null" size="small" type="warning">沿用上一版备注</el-tag>
          <el-button link type="danger" size="small" @click="removeNote(note.id)">删除</el-button>
        </div>
        <p class="note-body">{{ note.comment }}</p>
      </li>
    </ul>
    <p v-else class="muted no-note">暂无审阅备注</p>

    <div class="note-editor">
      <el-select v-model="tag" size="small" class="note-tag-select">
        <el-option v-for="item in REVIEW_NOTE_TAGS" :key="item" :label="item" :value="item" />
      </el-select>
      <el-input
        v-model="comment"
        size="small"
        type="textarea"
        :rows="2"
        placeholder="写下审阅备注，导入更新版本后备注会自动保留…"
      />
      <el-button size="small" type="primary" :loading="busy" @click="addNote">添加备注</el-button>
    </div>
  </div>
</template>
