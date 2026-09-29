import { computed, ref, type Ref } from "vue";
import { readValue, writeValue, type StorageKey } from "../api/localStorage";

export interface PaginationLike {
  page: Ref<number>;
  pageSize: number;
  total: Ref<number>;
}

/**
 * 将响应式状态持久化到 localStorage（仅保存偏好类数据，业务表走 api 层）。
 */
export function useLocalStorageState<T>(key: StorageKey, defaultValue: T) {
  const state = ref(defaultValue) as Ref<T>;
  const stored = readValue<T>(key, defaultValue);
  state.value = stored;

  const persist = (value: T) => {
    state.value = value;
    writeValue(key, value);
  };

  return { state, persist };
}

/** 前端分页工具，列表页共用 */
export function usePagination<T>(rows: Ref<T[]>, pageSize = 8) {
  const page = ref(1);
  const total = computed(() => rows.value.length);
  const pageRows = computed(() =>
    rows.value.slice((page.value - 1) * pageSize, page.value * pageSize)
  );
  const reset = () => {
    page.value = 1;
  };
  return { page, pageSize, total, pageRows, reset };
}
