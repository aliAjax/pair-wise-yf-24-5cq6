import { defineStore } from "pinia";
import { computed, ref } from "vue";
import * as noteApi from "../api/ReviewNote";
import type { ReviewNote } from "../types/ReviewNote";
import type { ReviewStatus } from "../types/ReviewStatus";
import { addReviewNote, deleteReviewNote, updateReviewNote } from "../services/reviewNoteService";

/** 审阅备注 store：新增、改标签、删除；导入新版本后备注由 diffService 继承保留 */
export const useReviewNoteStore = defineStore("reviewNote", () => {
  const rows = ref<ReviewNote[]>([]);
  const loading = ref(false);

  const byDiff = computed(() => {
    const map = new Map<number, ReviewNote[]>();
    rows.value.forEach((note) => {
      const list = map.get(note.diff_result_id) ?? [];
      list.push(note);
      map.set(note.diff_result_id, list);
    });
    map.forEach((list) => list.sort((a, b) => b.created_at.localeCompare(a.created_at)));
    return map;
  });

  async function load(): Promise<void> {
    loading.value = true;
    rows.value = await noteApi.listReviewNote();
    loading.value = false;
  }

  async function add(input: { diff_result_id: number; tag: string; comment: string; reviewer: string }) {
    const note = await addReviewNote(input);
    rows.value.push(note);
    return note;
  }

  async function update(noteId: number, patch: { tag?: string; comment?: string; status?: ReviewStatus }) {
    const note = await updateReviewNote(noteId, patch);
    const index = rows.value.findIndex((row) => row.id === noteId);
    if (index >= 0) rows.value[index] = note;
    return note;
  }

  async function remove(noteId: number) {
    await deleteReviewNote(noteId);
    rows.value = rows.value.filter((note) => note.id !== noteId);
  }

  function notesOf(diffId: number): ReviewNote[] {
    return byDiff.value.get(diffId) ?? [];
  }

  return { rows, loading, byDiff, load, add, update, remove, notesOf };
});
