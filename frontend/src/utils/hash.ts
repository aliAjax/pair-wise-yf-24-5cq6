/**
 * 条款内容指纹：归一化后做 djb2 哈希。
 * 不是加密用途，只需在重新对比时稳定判断“条款内容是否又变过”。
 */
export const hashContent = (text: string): string => {
  const normalized = text.replace(/\s+/g, "").trim();
  let hash = 5381;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 33) ^ normalized.charCodeAt(index);
  }
  // 转为无符号 36 进制，短小且稳定
  return (hash >>> 0).toString(36);
};
