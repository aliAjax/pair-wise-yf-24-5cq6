import type { PolicySection } from "../types/PolicySection";
import { hashText } from "./hash";
import { classifySection } from "./riskClassifier";

export interface ParsedSectionDraft {
  section_no: string;
  heading: string;
  content: string;
  content_hash: string;
}

/**
 * 政策文本分段：支持“第一条 / 第1条 / 一、 / 1. / 1、 / 1）”开头的条款。
 * 首个条款之前的抬头行（政策名、版本号、生效日期）忽略，不视为条款。
 */
const SECTION_HEAD = /^\s*(?:第\s*[0-9０-９一二三四五六七八九十百]+\s*条|[0-9０-９]+\s*[.．、）)]|[一二三四五六七八九十]+\s*[、.．])/;
/** 标题与正文写在同一行时的切分：编号后紧跟的短标题（到首个句读为止） */
const SAME_LINE_TITLE = /^([^\n。；;，,]{2,30})(?:[。；;，,]\s*|\s+)([\s\S]*)$/;

export function parsePolicyText(raw: string): ParsedSectionDraft[] {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  const blocks: { headLine: string; body: string[] }[] = [];
  let current: { headLine: string; body: string[] } | null = null;

  lines.forEach((line) => {
    if (SECTION_HEAD.test(line)) {
      current = { headLine: line.trim(), body: [] };
      blocks.push(current);
    } else if (current && line.trim()) {
      current.body.push(line.trim());
    }
  });

  const drafts: ParsedSectionDraft[] = [];

  blocks.forEach((block, index) => {
    const matched = block.headLine.match(SECTION_HEAD);
    const head = matched ? matched[0].trim() : `第${index + 1}条`;
    const rest = block.headLine.slice(matched ? matched[0].length : 0).trim();
    const bodyText = block.body.join("\n").trim();

    let heading = "";
    let content = "";
    if (bodyText) {
      // 编号后另有独立标题行：标题=rest，正文=后续行
      heading = rest;
      content = bodyText;
    } else {
      // 标题与正文在同一行，按第一个句读切出短标题；切不出来则整体作为正文
      const split = rest.match(SAME_LINE_TITLE);
      if (split && split[1].length <= 30) {
        heading = split[1].trim();
        content = split[2].trim();
      } else {
        heading = rest.slice(0, 20);
        content = rest;
      }
    }
    if (!heading) heading = content.slice(0, 20);
    drafts.push(buildDraft(head, heading, content));
  });

  return drafts.filter((d) => d.content || d.heading);
}

function buildDraft(sectionNo: string, heading: string, content = ""): ParsedSectionDraft {
  const full = `${heading}\n${content}`;
  return {
    section_no: sectionNo,
    heading: heading.trim(),
    content: content.trim(),
    content_hash: hashText(full)
  };
}

/** 导入时把解析草稿补齐为带类别/风险的条款（新增条款自动风险标注） */
export function draftToSections(
  drafts: ParsedSectionDraft[],
  documentId: number,
  idFrom: number
): { sections: PolicySection[]; nextId: number } {
  const sections: PolicySection[] = drafts.map((draft, index) => {
    const verdict = classifySection(`${draft.heading}\n${draft.content}`);
    return {
      id: idFrom + index,
      document_id: documentId,
      section_no: draft.section_no,
      heading: draft.heading,
      content: draft.content,
      content_hash: draft.content_hash,
      category: verdict.category,
      risk_level: verdict.riskLevel,
      is_newly_added: false
    };
  });
  return { sections, nextId: idFrom + sections.length };
}
