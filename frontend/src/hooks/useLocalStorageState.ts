import { onMounted, ref, watch, type Ref } from "vue";

/**
 * 本地存储状态 hook：把响应式状态持久化到 localStorage。
 * 业务数据由 api 层分表落库；本 hook 用于 UI 偏好（审查员姓名、筛选条件等）。
 */
export function useLocalStorageState<T>(key: string, defaultValue: T): Ref<T> {
  const storageKey = `policy-diff:ui:${key}`;
  const read = (): T => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const state = ref(defaultValue) as Ref<T>;
  state.value = read();
  let ready = false;

  onMounted(() => {
    ready = true;
  });

  watch(
    state,
    (value) => {
      if (!ready) return;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        // 隐私模式等场景下静默降级为内存态
      }
    },
    { deep: true }
  );

  return state;
}
