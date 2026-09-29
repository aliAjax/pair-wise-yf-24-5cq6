import { LOG_TEMPLATES, type LogAction, type LogEntity } from "../constants/logTemplates";

export interface LogEntry {
  time: string;
  entity: LogEntity;
  action: string;
  message: string;
}

const LOG_BUFFER_LIMIT = 300;
const logBuffer: LogEntry[] = [];

/**
 * 唯一日志出口：所有写操作在 service 层调用 recordLog。
 * 同时输出 console 与内存缓冲（审阅页“操作记录”可查），与 logTemplates 强耦合。
 */
export function recordLog<E extends LogEntity>(entity: E, action: LogAction<E>, params: Record<string, string | number> = {}): string {
  const template = (LOG_TEMPLATES[entity] as Record<string, string>)[action as string] ?? "";
  const message = template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? ""));
  const entry: LogEntry = { time: new Date().toISOString(), entity, action: action as string, message };
  logBuffer.unshift(entry);
  if (logBuffer.length > LOG_BUFFER_LIMIT) logBuffer.length = LOG_BUFFER_LIMIT;
  if (typeof console !== "undefined") console.info(`[policy-diff] ${entry.message}`);
  return message;
}

export function getLogEntries(): LogEntry[] {
  return [...logBuffer];
}
