<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { DiffResult } from "../../types/DiffResult";
import type { ReviewNote } from "../../types/ReviewNote";
import { REVIEW_STATUSES, REVIEW_STATUS_TEXT } from "../../constants/ReviewStatus";
import { ERROR_MESSAGES } from "../../constants/errorMessages";
import { formatDate } from "../../utils/formatters";
import StatusBadge from "./StatusBadge.vue";

const props = defineProps<{
  diff: DiffResult;
  notes: ReviewNote[];
  reviewer: string;
  reopened?: boolean;
}>();

const emit = defineEmits<{
  (event: "add", payload: { diffResultId: number; tag: string; comment: string; reviewer: string; status: ReviewNote["status"] }): void;
  (event: "status", payload: { noteId: number; status: ReviewNote["status"] }): void;
}>();

const tag = ref("");
const comment = ref("");
const errorMessage = ref("");

const latest = computed(() => props.notes[props.notes.length - 1] ?? null);

watch(
  () => props.diff.id,
  () => {
    comment.value = "";
    tag.value = "";
    errorMessage.value = "";
  }
);

const submit = (status: ReviewNote["status"]) => {
  errorMessage.value = "";
  if (!props.reviewer.trim()) {
    errorMessage.value = ERROR_MESSAGES.REVIEWER_REQUIRED;
    return;
  }
  // 异步结果（含错误提示）由父页面统一处理，这里只负责本地校验与清空
  emit("add", {
    diffResultId: props.diff.id,
    tag: tag.value,
    comment: comment.value,
    reviewer: props.reviewer,
    status
  });
  comment.value = "";
  tag.value = "";
};

const changeStatus = (noteId: number, status: ReviewNote["status"]) => {
  emit("status", { noteId, status });
};
</script>

<template>
  <div class="review-checklist" :class="{ reopened }">
    <el-alert
      v-if="reopened"
      type="error"
      show-icon
      :closable="false"
      class="reopen-banner"
      title="该条款在确认后又被改动，之前的结论已自动退回为「待处理」，请按新版本重新审阅；历史备注仍保留在下方。"
    />

    <div v-if="notes.length > 0" class="note-history">
      <h4>审阅备注（{{ notes.length }}）</h4>
      <ul>
        <li v-for="note in notes" :key="note.id">
          <div class="note-line">
            <StatusBadge kind="review" :value="note.status" />
            <span class="note-reviewer">{{ note.reviewer }}</span>
            <span v-if="note.tag" class="note-tag">#{{ note.tag }}</span>
            <span class="note-time">{{ formatDate(note.updated_at) }}</span>
          </div>
          <p class="note-comment">{{ note.comment || "（未填写备注）" }}</p>
          <div v-if="latest?.id === note.id" class="note-actions">
            <button
              v-for="status in REVIEW_STATUSES.filter((item) => item !== note.status)"
              :key="status"
              class="btn mini"
              @click="changeStatus(note.id, status)"
            >
              标记为{{ REVIEW_STATUS_TEXT[status] }}
            </button>
          </div>
        </li>
      </ul>
    </div>

    <div class="note-form">
      <h4>{{ latest ? "追加审阅意见" : "添加审阅意见" }}</h4>
      <div class="note-form-row">
        <input v-model="tag" type="text" placeholder="标签（如：数据收集 / 合规）" />
      </div>
      <textarea v-model="comment" rows="3" placeholder="写下对该条变化的审阅意见，备注会在版本更新后保留…" />
      <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
      <div class="note-form-actions">
        <button class="btn" @click="submit('OPEN')">存为待处理</button>
        <button class="btn success" @click="submit('CONFIRMED')">确认该改动</button>
        <button class="btn ghost" @click="submit('IGNORED')">忽略</button>
      </div>
    </div>
  </div>
</template>
