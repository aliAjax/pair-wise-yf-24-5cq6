/**
 * 日志模板集中维护，所有写操作经 logger 输出。
 * 字段变更时必须同步修改这里的模板与调用处（stores / pages）。
 */
export const LOG_TEMPLATES = {
  PolicyDocument: {
    CREATE: "政策文档创建：#{id} 《{title}》版本 {versionLabel}",
    UPDATE: "政策文档更新：#{id} 《{title}》",
    IMPORT: "政策文档导入：#{id} 《{title}》，共 {sectionCount} 个条款",
    DELETE: "政策文档删除：#{id} 《{title}》",
    EXPORT: "政策文档导出：#{id} 《{title}》"
  },
  PolicySection: {
    CREATE: "条款段落创建：#{id} {sectionNo} {heading}",
    UPDATE: "条款段落更新：#{id} {sectionNo} {heading}",
    RECLASSIFY: "条款风险改判：#{id} {sectionNo} 风险等级 {fromRisk} → {toRisk}",
    EXPORT: "条款段落导出：文档 #{documentId} 共 {sectionCount} 个条款"
  },
  DiffResult: {
    CREATE: "差异结果生成：{oldLabel} → {newLabel}，{diffCount} 条变化",
    UPDATE: "差异结果更新：#{id} 类型 {diffType}",
    REOPEN: "差异确认退回：#{id} 条款 {matchKey} 内容已再次变化，{fromStatus} → {toStatus}",
    EXPORT: "差异结果导出：{oldLabel} → {newLabel}"
  },
  ReviewNote: {
    CREATE: "审阅备注创建：#{id} 差异 #{diffResultId} 审阅人 {reviewer}",
    UPDATE: "审阅备注更新：#{id} 审阅人 {reviewer}",
    STATUS_CHANGE: "审阅备注状态变更：#{id} {fromStatus} → {toStatus}",
    EXPORT: "审阅备注导出 Markdown 摘要：{noteCount} 条"
  }
} as const;

export type LogTemplateEntity = keyof typeof LOG_TEMPLATES;
