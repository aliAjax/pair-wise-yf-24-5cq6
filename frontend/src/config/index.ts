/** 全局运行配置：由 .env(经 Vite 注入) 与默认值合并，请求封装/存储/日志统一读取 */
export const APP_CONFIG = {
  appName: "policy-diff",
  storagePrefix: "policy-diff",
  useRemoteApi: false,
  apiBase: "/api",
  storageKeys: {
    policyDocument: "policy-diff:policy-document",
    policySection: "policy-diff:policy-section",
    diffResult: "policy-diff:diff-result",
    reviewNote: "policy-diff:review-note",
    meta: "policy-diff:meta",
    seeded: "policy-diff:seeded"
  }
} as const;
