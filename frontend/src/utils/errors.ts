import { ERROR_CODES, type ErrorCode } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";

/** 业务异常，service / store 层抛出，页面层负责提示 */
export class PolicyDiffError extends Error {
  readonly code: ErrorCode;
  readonly detail?: unknown;

  constructor(code: ErrorCode, detail?: unknown) {
    super(ERROR_MESSAGES[code] ?? code);
    this.name = "PolicyDiffError";
    this.code = code;
    this.detail = detail;
  }
}

export const isPolicyDiffError = (error: unknown): error is PolicyDiffError =>
  error instanceof PolicyDiffError && Object.values(ERROR_CODES).includes(error.code as (typeof ERROR_CODES)[ErrorCode]);

/** 页面层统一取错误文案 */
export const resolveErrorMessage = (error: unknown): string => {
  if (isPolicyDiffError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return ERROR_MESSAGES.VALIDATION_FAILED;
};
