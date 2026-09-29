/** 逐字/逐词差异引擎（LCS），供 DiffViewer 做左右行内高亮 */

export interface DiffSegment {
  type: "equal" | "added" | "removed";
  text: string;
}

/** 中文逐字、英文/数字按词切分，标点随相邻 token 合并 */
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const word = /[A-Za-z0-9]+/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = word.exec(text)) !== null) {
    for (const ch of text.slice(last, match.index)) tokens.push(ch);
    tokens.push(match[0]);
    last = match.index + match[0].length;
  }
  for (const ch of text.slice(last)) tokens.push(ch);
  return tokens.filter((t) => t !== "");
}

function compress(segments: DiffSegment[]): DiffSegment[] {
  const out: DiffSegment[] = [];
  segments.forEach((seg) => {
    const tail = out[out.length - 1];
    if (tail && tail.type === seg.type) tail.text += seg.text;
    else out.push({ ...seg });
  });
  return out;
}

export interface TextDiffResult {
  oldSegments: DiffSegment[];
  newSegments: DiffSegment[];
  addedChars: number;
  removedChars: number;
  changed: boolean;
}

export function diffText(oldText: string, newText: string): TextDiffResult {
  const a = tokenize(oldText);
  const b = tokenize(newText);
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const oldSegments: DiffSegment[] = [];
  const newSegments: DiffSegment[] = [];
  let i = 0;
  let j = 0;
  let addedChars = 0;
  let removedChars = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      oldSegments.push({ type: "equal", text: a[i] });
      newSegments.push({ type: "equal", text: b[j] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      oldSegments.push({ type: "removed", text: a[i] });
      removedChars += a[i].length;
      i += 1;
    } else {
      newSegments.push({ type: "added", text: b[j] });
      addedChars += b[j].length;
      j += 1;
    }
  }
  while (i < a.length) {
    oldSegments.push({ type: "removed", text: a[i] });
    removedChars += a[i].length;
    i += 1;
  }
  while (j < b.length) {
    newSegments.push({ type: "added", text: b[j] });
    addedChars += b[j].length;
    j += 1;
  }
  return {
    oldSegments: compress(oldSegments),
    newSegments: compress(newSegments),
    addedChars,
    removedChars,
    changed: addedChars + removedChars > 0
  };
}
