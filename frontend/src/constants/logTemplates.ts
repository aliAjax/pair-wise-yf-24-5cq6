/**
 * 日志模板集中处：每个实体至少 4 条，所有写操作都要通过 logger 记录。
 * 字段/流程变更时必须同步修改模板与调用处（service 层调用）。
 * 占位符：{entity} 实体名，{id} 记录 id，{detail} 附加上下文。
 */
export const LOG_TEMPLATES = {
  PolicyDocument: {
    create: "政策文档创建：id={id}，标题={title}，版本={version}",
    update: "政策文档更新：id={id}，变更字段={fields}",
    delete: "政策文档删除：id={id}，级联清理条款与差异",
    import: "政策文档导入：id={id}，解析条款 {sectionCount} 条"
  },
  PolicySection: {
    create: "条款段落创建：id={id}，编号={sectionNo}",
    update: "条款段落更新：id={id}，变更字段={fields}",
    riskOverride: "条款风险手工标注：id={id}，类别={category}，风险={riskLevel}",
    export: "条款段落导出：文档 {documentId}，共 {count} 条"
  },
  DiffResult: {
    create: "差异结果创建：id={id}，类型={diffType}，{oldDocId} -> {newDocId}",
    regenerate: "版本对比生成：{oldDocId} -> {newDocId}，新增 {added} / 移除 {removed} / 改动 {modified} / 移动 {moved} / 未变 {unchanged}",
    statusChange: "差异结果状态变更：id={id}，{from} -> {to}，审查员={reviewer}",
    invalidate: "确认结论失效：差异 id={id}，已确认内容指纹变更，退回待处理",
    supersede: "历史差异归档：id={id} 被 id={newId} 取代",
    export: "差异结果导出：{oldDocId} -> {newDocId}，共 {count} 条"
  },
  ReviewNote: {
    create: "审阅备注创建：id={id}，差异={diffResultId}，标签={tag}",
    update: "审阅备注更新：id={id}，变更字段={fields}",
    inherit: "审阅备注沿用：备注 id={id} 从差异 {fromDiffId} 带到差异 {toDiffId}，旧结论已退回待处理",
    statusChange: "审阅备注状态变更：id={id}，{from} -> {to}",
    export: "审阅备注导出：差异 {diffResultId}，共 {count} 条"
  }
} as const;

export type LogEntity = keyof typeof LOG_TEMPLATES;
export type LogAction<E extends LogEntity> = keyof (typeof LOG_TEMPLATES)[E];
