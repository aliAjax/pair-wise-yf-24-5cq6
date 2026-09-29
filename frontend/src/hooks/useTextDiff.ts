import { computed, ref } from "vue";

export type DiffLineKind = "ADDED_LINE" | "REMOVED_LINE" | "CONTEXT";

export interface DiffLine {
  kind: DiffLineKind;
  /** 旧版行号（新增行为 null） */
  oldLineNo: number | null;
  /** 新版行号（删除行为 null） */
  newLineNo: number | null;
  text: string;
  /** 行内字符级差异片段 */
  segments: DiffSegment[];
}

export interface DiffSegment {
  kind: "EQUAL" | "INSERT" | "DELETE";
  text: string;
}

export interface TextDiffStats {
  addedLines: number;
  removedLines: number;
  unchangedLines: number;
}

const splitLines = (text: string): string[] =>
  text.replace(/\r\n/g, "\n").split("\n").filter((line) => line.trim().length > 0);

/** 通用 LCS，返回成对序列：type=same 表示两侧匹配，否则为各自独有片段 */
function lcs<T>(left: T[], right: T[]): { type: "same" | "left" | "right"; value: T }[] {
  const m = left.length;
  const n = right.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      dp[i][j] = left[i] === right[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const result: { type: "same" | "left" | "right"; value: T }[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (left[i] === right[j]) {
      result.push({ type: "same", value: left[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: "left", value: left[i] });
      i += 1;
    } else {
      result.push({ type: "right", value: right[j] });
      j += 1;
    }
  }
  while (i < m) {
    result.push({ type: "left", value: left[i] });
    i += 1;
  }
  while (j < n) {
    result.push({ type: "right", value: right[j] });
    j += 1;
  }
  return result;
}

/** 中文文本按字符切，英文/数字按词切，保证行内差异可读 */
const tokenize = (line: string): string[] => {
  const tokens: string[] = [];
  const wordPattern = /[A-Za-z0-9]+|\s+|[^\sA-Za-z0-9]/g;
  const matched = line.match(wordPattern);
  if (matched) tokens.push(...matched);
  return tokens;
};

/** 行内差异：相邻的删除行/新增行之间再做一次 token LCS */
const inlineSegments = (removed: string[], added: string[]): { removed: DiffLine[]; added: DiffLine[] } => {
  const removedPairs = lcs(tokenize(removed.join("\n")), tokenize(added.join("\n")));

  const oldSegments: DiffSegment[] = [];
  const newSegments: DiffSegment[] = [];
  removedPairs.forEach((pair) => {
    if (pair.type === "same") {
      oldSegments.push({ kind: "EQUAL", text: pair.value });
      newSegments.push({ kind: "EQUAL", text: pair.value });
    } else if (pair.type === "left") {
      oldSegments.push({ kind: "DELETE", text: pair.value });
    } else {
      newSegments.push({ kind: "INSERT", text: pair.value });
    }
  });

  // 行内片段只用于单句改动展示；多行增删仍逐行挂载
  const removedLines: DiffLine[] = removed.map((text) => ({
    kind: "REMOVED_LINE",
    oldLineNo: null,
    newLineNo: null,
    text,
    segments: text === removed.join("\n") ? oldSegments : [{ kind: "EQUAL", text }]
  }));
  const addedLines: DiffLine[] = added.map((text) => ({
    kind: "ADDED_LINE",
    oldLineNo: null,
    newLineNo: null,
    text,
    segments: text === added.join("\n") ? newSegments : [{ kind: "EQUAL", text }]
  }));

  return { removed: removedLines, added: addedLines };
};

/** 计算两段文本的行级差异 */
export const diffText = (oldText: string, newText: string): DiffLine[] => {
  const oldLines = splitLines(oldText);
  const newLines = splitLines(newText);
  const pairs = lcs(oldLines, newLines);

  const lines: DiffLine[] = [];
  let oldLineNo = 0;
  let newLineNo = 0;
  let cursor = 0;

  while (cursor < pairs.length) {
    const pair = pairs[cursor];
    if (pair.type === "same") {
      oldLineNo += 1;
      newLineNo += 1;
      lines.push({
        kind: "CONTEXT",
        oldLineNo,
        newLineNo,
        text: pair.value,
        segments: [{ kind: "EQUAL", text: pair.value }]
      });
      cursor += 1;
      continue;
    }
    // 收集连续的 left/right 片段做行内对比
    const removed: string[] = [];
    const added: string[] = [];
    while (cursor < pairs.length && pairs[cursor].type !== "same") {
      if (pairs[cursor].type === "left") removed.push(pairs[cursor].value);
      else added.push(pairs[cursor].value);
      cursor += 1;
    }
    if (removed.length === 1 && added.length === 1) {
      const inline = inlineSegments(removed, added);
      inline.removed.forEach((line) => {
        oldLineNo += 1;
        lines.push({ ...line, oldLineNo });
      });
      inline.added.forEach((line) => {
        newLineNo += 1;
        lines.push({ ...line, newLineNo });
      });
    } else {
      removed.forEach((text) => {
        oldLineNo += 1;
        lines.push({ kind: "REMOVED_LINE", oldLineNo, newLineNo: null, text, segments: [{ kind: "DELETE", text }] });
      });
      added.forEach((text) => {
        newLineNo += 1;
        lines.push({ kind: "ADDED_LINE", oldLineNo: null, newLineNo, text, segments: [{ kind: "INSERT", text }] });
      });
    }
  }
  return lines;
};

export const summarizeDiff = (lines: DiffLine[]): TextDiffStats => ({
  addedLines: lines.filter((line) => line.kind === "ADDED_LINE").length,
  removedLines: lines.filter((line) => line.kind === "REMOVED_LINE").length,
  unchangedLines: lines.filter((line) => line.kind === "CONTEXT").length
});

/**
 * 文本差异 composable：响应式持有两段文本与差异结果，DiffViewer 直接消费。
 */
export function useTextDiff(oldText = "", newText = "") {
  const oldContent = ref(oldText);
  const newContent = ref(newText);
  const lines = computed<DiffLine[]>(() => diffText(oldContent.value, newContent.value));
  const stats = computed<TextDiffStats>(() => summarizeDiff(lines.value));
  const hasChanges = computed(() => stats.value.addedLines + stats.value.removedLines > 0);

  const setTexts = (nextOld: string, nextNew: string) => {
    oldContent.value = nextOld;
    newContent.value = nextNew;
  };

  return { oldContent, newContent, lines, stats, hasChanges, setTexts, diffText };
}
