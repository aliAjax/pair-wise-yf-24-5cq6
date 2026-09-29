/**
 * 本地请求封装：当前 useRemoteApi=false，所有数据走 localStorage。
 * 保留 fetch 分支与一致的异常包装，未来接入后端时仅切换 config。
 */
import { APP_CONFIG } from "../config";
import { AppError, ERROR_CODES } from "./appError";

export interface ApiEnvelope<T> {
  data: T;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!APP_CONFIG.useRemoteApi) {
    throw new AppError(ERROR_CODES.RBAC_DENIED);
  }
  const res = await fetch(`${APP_CONFIG.apiBase}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init
  });
  if (!res.ok) throw new AppError(ERROR_CODES.VALIDATION_FAILED, { detail: res.status });
  return (await res.json()) as T;
}
