import { computed, ref } from "vue";
import { classifySection } from "../utils/riskClassifier";
import { parsePolicyText, type ParsedSectionDraft } from "../utils/policyParser";

/** 政策解析 hook：导入页粘贴文本后实时预览分段与自动风险标注 */
export function usePolicyParser(rawText: () => string) {
  const drafts = ref<ParsedSectionDraft[]>([]);

  const parsed = computed(() => {
    const text = rawText();
    if (!text.trim()) {
      drafts.value = [];
      return [];
    }
    drafts.value = parsePolicyText(text);
    return drafts.value;
  });

  const preview = computed(() =>
    parsed.value.map((draft) => ({
      ...draft,
      verdict: classifySection(`${draft.heading}\n${draft.content}`)
    }))
  );

  const sectionCount = computed(() => parsed.value.length);
  const riskCounts = computed(() => {
    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 } as Record<string, number>;
    preview.value.forEach((item) => {
      counts[item.verdict.riskLevel] += 1;
    });
    return counts;
  });

  return { parsed, preview, sectionCount, riskCounts };
}
