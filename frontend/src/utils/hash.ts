/** 小型确定性字符串哈希（FNV-1a 变体），用于条款内容指纹，非加密用途 */
export function hashText(input: string): string {
  const normalized = input.replace(/\s+/g, "").trim();
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
