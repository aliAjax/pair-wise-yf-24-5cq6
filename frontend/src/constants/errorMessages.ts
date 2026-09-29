import { ERROR_CODES } from "./errorCodes";

export const ERROR_MESSAGES: Record<keyof typeof ERROR_CODES, string> = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  EMPTY_POLICY_TEXT: "政策正文不能为空，请粘贴需要导入的版本文本",
  MISSING_VERSION_LABEL: "请填写版本标签（如 v2.1 / 2026-09 版）",
  DOCUMENT_NOT_FOUND: "未找到指定的政策文档",
  SECTION_NOT_FOUND: "未找到指定的条款段落",
  DIFF_NOT_FOUND: "未找到指定的差异结果，请重新选择两版政策进行对比",
  SAME_VERSION_COMPARE: "不能将同一版政策与自身对比，请选择两个不同版本",
  REVIEWER_REQUIRED: "请填写审阅人姓名后再确认",
  STORAGE_UNAVAILABLE: "浏览器 localStorage 不可用，无法保存导入与审阅数据"
};
