import { ERROR_CODES } from "../constants/errorCodes";
import { PolicyDiffError } from "../utils/errors";

const PREFIX = "policy-diff:";

export const STORAGE_KEYS = {
  policyDocument: `${PREFIX}policy-document`,
  policySection: `${PREFIX}policy-section`,
  diffResult: `${PREFIX}diff-result`,
  reviewNote: `${PREFIX}review-note`,
  meta: `${PREFIX}meta`,
  reviewPrefs: `${PREFIX}review-prefs`
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;

export const isStorageAvailable = (): boolean => {
  try {
    const probe = `${PREFIX}probe`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
};

export const readRows = <T>(key: StorageKey): T[] => {
  if (!isStorageAvailable()) throw new PolicyDiffError(ERROR_CODES.STORAGE_UNAVAILABLE);
  const raw = window.localStorage.getItem(STORAGE_KEYS[key]);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

export const writeRows = <T>(key: StorageKey, rows: T[]): void => {
  if (!isStorageAvailable()) throw new PolicyDiffError(ERROR_CODES.STORAGE_UNAVAILABLE);
  window.localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(rows));
};

export const readValue = <T>(key: StorageKey, fallback: T): T => {
  if (!isStorageAvailable()) return fallback;
  const raw = window.localStorage.getItem(STORAGE_KEYS[key]);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const writeValue = <T>(key: StorageKey, value: T): void => {
  if (!isStorageAvailable()) throw new PolicyDiffError(ERROR_CODES.STORAGE_UNAVAILABLE);
  window.localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
};

/** 各表自增 ID，按当前最大值 +1 初始化 */
export const nextId = (rows: { id: number }[]): number =>
  rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
