import { LOG_TEMPLATES, type LogTemplateEntity } from "../constants/logTemplates";

export interface LogEntry {
  time: string;
  entity: LogTemplateEntity;
  action: string;
  message: string;
}

const HISTORY_LIMIT = 200;
const history: LogEntry[] = [];

const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));

/**
 * 集中日志：所有写操作必须经过这里，模板改动只需同步 constants/logTemplates。
 */
export const logAction = (
  entity: LogTemplateEntity,
  action: string,
  vars: Record<string, string | number> = {}
): LogEntry => {
  const templates = LOG_TEMPLATES[entity] as Record<string, string>;
  const entry: LogEntry = {
    time: new Date().toISOString(),
    entity,
    action,
    message: fill(templates[action] ?? action, vars)
  };
  history.unshift(entry);
  if (history.length > HISTORY_LIMIT) history.length = HISTORY_LIMIT;
  console.info(`[policy-diff] ${entry.message}`);
  return entry;
};

export const getLogHistory = (): readonly LogEntry[] => history;
