import { APP_CONFIG } from "../config";
import { AppError, ERROR_CODES } from "./appError";

/** localStorage 读写唯一出口：api 层按模型分文件调用本模块 */
export function readTable<T>(key: keyof typeof APP_CONFIG.storageKeys): T[] {
  try {
    const raw = window.localStorage.getItem(APP_CONFIG.storageKeys[key]);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function writeTable<T>(key: keyof typeof APP_CONFIG.storageKeys, rows: T[]): void {
  try {
    window.localStorage.setItem(APP_CONFIG.storageKeys[key], JSON.stringify(rows));
  } catch {
    throw new AppError(ERROR_CODES.LOCAL_STORAGE_UNAVAILABLE);
  }
}

export function readMeta<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(`${APP_CONFIG.storagePrefix}:meta:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeMeta<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(`${APP_CONFIG.storagePrefix}:meta:${key}`, JSON.stringify(value));
  } catch {
    throw new AppError(ERROR_CODES.LOCAL_STORAGE_UNAVAILABLE);
  }
}
