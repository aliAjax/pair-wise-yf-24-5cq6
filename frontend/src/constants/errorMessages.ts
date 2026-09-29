import { ERROR_CODES } from "./errorCodes";

/** 错误消息模板集中处：格式化逻辑在 utils/formatters.formatError，service/store 分别包装抛出 */
export const ERROR_MESSAGES: Record<(typeof ERROR_CODES)[keyof typeof ERROR_CODES], string> = {
  [ERROR_CODES.AUTH_REQUIRED]: "请先登录后再继续操作",
  [ERROR_CODES.RBAC_DENIED]: "当前角色没有执行该动作的权限",
  [ERROR_CODES.VALIDATION_FAILED]: "表单字段缺失或格式错误",
  [ERROR_CODES.RATE_LIMITED]: "请求过于频繁，请稍后再试",
  [ERROR_CODES.DOCUMENT_EMPTY]: "政策文本不能为空，请粘贴或载入示例后再导入",
  [ERROR_CODES.DOCUMENT_VERSION_DUPLICATED]: "已存在版本号为「{version}」的政策文档，请勿重复导入",
  [ERROR_CODES.SECTION_PARSE_EMPTY]: "未能从文本中识别出任何条款，请检查条款编号格式（如“第一条”“1.”“一、”）",
  [ERROR_CODES.COMPARE_SAME_DOCUMENT]: "请选择两版不同的政策文档进行对比",
  [ERROR_CODES.COMPARE_DOCUMENT_MISSING]: "请先选择要对比的新旧两版政策文档",
  [ERROR_CODES.LOCAL_STORAGE_UNAVAILABLE]: "浏览器本地存储不可用，无法保存审阅数据",
  [ERROR_CODES.RECORD_NOT_FOUND]: "目标记录不存在或已被删除：{entity}#{id}"
};
