import { ERROR_CODES, type ErrorCode } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";

/** 业务异常：service 抛出，controller/store 捕获后再次包装为用户可见提示 */
export class AppError extends Error {
  readonly code: ErrorCode;
  constructor(code: ErrorCode, params: Record<string, string | number> = {}) {
    super(formatMessage(code, params));
    this.name = "AppError";
    this.code = code;
  }
}

export function formatMessage(code: ErrorCode, params: Record<string, string | number> = {}): string {
  const template = ERROR_MESSAGES[code] ?? code;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? ""));
}

export { ERROR_CODES };
