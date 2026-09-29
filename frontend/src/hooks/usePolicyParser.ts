import { ref } from "vue";
import { CATEGORY_KEYWORDS, SECTION_CATEGORIES, NEW_SECTION_RISK_RULE } from "../constants/SectionCategory";
import type { SectionCategory } from "../types/SectionCategory";
import type { PrivacyRiskLevel } from "../types/PrivacyRiskLevel";

export interface ParsedSectionDraft {
  section_no: string;
  heading: string;
  content: string;
  category: SectionCategory;
  risk_level: PrivacyRiskLevel;
  match_key: string;
  content_hash: string;
}

export interface ParsePolicyResult {
  title: string;
  sections: ParsedSectionDraft[];
}

// JS 正则不支持 POSIX 类，序号标题使用下面两个模式
const ORDERED_HEADING = /^\s*([一二三四五六七八九十百零〇0-9]+(?:\.\d+)*)\s*[、.．]\s*(.+)$/;
const ARTICLE_HEADING = /^\s*第\s*([一二三四五六七八九十百零〇0-9]+)\s*条[\s:：]*(.*)$/;
const TITLE_LINE = /(隐私政策|隐私保护政策|个人信息保护政策|政策)$/;

/** 从条款标题 + 正文关键词推断分类（计分制，标题命中权重更高，避免单个泛化词误判） */
export const detectCategory = (heading: string, content: string): SectionCategory => {
  let best: SectionCategory = "OTHER";
  let bestScore = 0;
  for (const rule of CATEGORY_KEYWORDS) {
    const score = rule.keywords.reduce((total, keyword) => {
      if (heading.includes(keyword)) return total + 3;
      if (content.includes(keyword)) return total + 1;
      return total;
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      best = rule.category;
    }
  }
  return best;
};

const isHeadingLine = (line: string): { no: string; heading: string } | null => {
  const ordered = ORDERED_HEADING.exec(line);
  if (ordered && ordered[2].length <= 40) {
    return { no: ordered[1], heading: ordered[2].trim() };
  }
  const article = ARTICLE_HEADING.exec(line);
  if (article) {
    // “第三条 信息收集” → no=三；纯“第三条”则标题取后续正文首句
    return { no: article[1], heading: article[2]?.trim() ?? "" };
  }
  return null;
};

/**
 * 将粘贴的政策文本切分为条款段落：
 * 1) “1、xxx / 一、xxx / 1. xxx / 第三条”识别为条款标题；
 * 2) 标题前的零散段落归入“前言”；
 * 3) 依据关键词自动标注数据收集 / 信息共享 / 保存期限等分类。
 */
export const parsePolicyText = (raw: string): ParsePolicyResult => {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let title = "";
  const blocks: { no: string; heading: string; contentLines: string[] }[] = [];
  let current: { no: string; heading: string; contentLines: string[] } | null = null;
  let preamble: string[] = [];

  const pushCurrent = () => {
    if (current) blocks.push(current);
  };

  lines.forEach((line) => {
    if (!title && TITLE_LINE.test(line) && line.length <= 40) {
      title = line;
      return;
    }
    const matched = isHeadingLine(line);
    if (matched) {
      pushCurrent();
      current = { no: matched.no, heading: matched.heading, contentLines: [] };
      return;
    }
    if (current) current.contentLines.push(line);
    else preamble.push(line);
  });
  pushCurrent();

  // “第三条”后未带标题时，用正文首句兜底作为标题
  blocks.forEach((block) => {
    if (!block.heading && block.contentLines.length > 0) {
      block.heading = block.contentLines[0].slice(0, 24);
    }
    if (!block.heading) block.heading = `第${block.no}条`;
  });

  const sections: ParsedSectionDraft[] = [];
  if (preamble.length > 0) {
    const content = preamble.join("\n");
    sections.push({
      section_no: "0",
      heading: "前言 / 适用范围",
      content,
      category: detectCategory("前言", content),
      risk_level: "LOW",
      match_key: "preamble",
      content_hash: ""
    });
  }

  blocks.forEach((block) => {
    const content = block.contentLines.join("\n");
    const category = detectCategory(block.heading, content);
    sections.push({
      section_no: block.no,
      heading: block.heading,
      content,
      category,
      // 导入时即按新条款规则给出初始风险，法务可在风险页改判
      risk_level: NEW_SECTION_RISK_RULE[category],
      match_key: block.no,
      content_hash: ""
    });
  });

  return { title: title || "未命名隐私政策", sections };
};

/**
 * 政策解析 composable：封装粘贴文本的解析中态与预览结果。
 */
export function usePolicyParser() {
  const parsing = ref(false);

  const parse = async (raw: string): Promise<ParsePolicyResult> => {
    parsing.value = true;
    // 让大文本解析时输入框不卡顿
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    const result = parsePolicyText(raw);
    parsing.value = false;
    return result;
  };

  return { parsing, parse, parsePolicyText, detectCategory, categories: SECTION_CATEGORIES };
}
