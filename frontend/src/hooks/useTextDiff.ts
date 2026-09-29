import { computed, ref } from "vue";
import { diffText, type DiffSegment, type TextDiffResult } from "../utils/textDiffEngine";

/** 逐字/逐词文本对比 hook：封装 DiffViewer 左右两栏的分段结果 */
export function useTextDiff(oldText: () => string, newText: () => string) {
  const cacheKey = ref("");

  const result = computed<TextDiffResult>(() => {
    const oldValue = oldText();
    const newValue = newText();
    cacheKey.value = `${oldValue.length}:${newValue.length}`;
    return diffText(oldValue, newValue);
  });

  const oldSegments = computed<DiffSegment[]>(() => result.value.oldSegments);
  const newSegments = computed<DiffSegment[]>(() => result.value.newSegments);

  return {
    result,
    oldSegments,
    newSegments,
    changed: computed(() => result.value.changed),
    addedChars: computed(() => result.value.addedChars),
    removedChars: computed(() => result.value.removedChars)
  };
}
