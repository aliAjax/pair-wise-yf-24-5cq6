<script setup lang="ts">
import { computed, ref } from "vue";
import { usePolicyParser, type ParsedSectionDraft } from "../../hooks/usePolicyParser";
import { SECTION_CATEGORY_TEXT } from "../../constants/SectionCategory";
import { ERROR_MESSAGES } from "../../constants/errorMessages";
import { resolveErrorMessage } from "../../utils/errors";
import EmptyState from "./EmptyState.vue";
import RiskTag from "./RiskTag.vue";
import { SAMPLE_NEW_POLICY, SAMPLE_OLD_POLICY } from "../../mocks/samplePolicies";

const emit = defineEmits<{
  (event: "import", payload: { title: string; versionLabel: string; rawText: string; drafts: ParsedSectionDraft[] }): void;
}>();

const title = ref("");
const versionLabel = ref("");
const rawText = ref("");
const errorMessage = ref("");
const importing = defineModel<boolean>("importing", { default: false });

const { parsing, parse } = usePolicyParser();
const drafts = ref<ParsedSectionDraft[]>([]);
const parsedTitle = ref("");
const previewed = ref(false);

const canParse = computed(() => rawText.value.trim().length > 0 && versionLabel.value.trim().length > 0);

const runParse = async () => {
  errorMessage.value = "";
  if (!rawText.value.trim()) {
    errorMessage.value = ERROR_MESSAGES.EMPTY_POLICY_TEXT;
    return;
  }
  if (!versionLabel.value.trim()) {
    errorMessage.value = ERROR_MESSAGES.MISSING_VERSION_LABEL;
    return;
  }
  try {
    const result = await parse(rawText.value);
    parsedTitle.value = result.title;
    drafts.value = result.sections;
    if (!title.value.trim()) title.value = result.title;
    previewed.value = true;
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error);
  }
};

const submit = () => {
  if (!previewed.value || drafts.value.length === 0) {
    errorMessage.value = "请先解析文本并确认条款分段后再导入";
    return;
  }
  emit("import", {
    title: title.value.trim() || parsedTitle.value,
    versionLabel: versionLabel.value.trim(),
    rawText: rawText.value,
    drafts: drafts.value
  });
};

const reset = () => {
  title.value = "";
  versionLabel.value = "";
  rawText.value = "";
  drafts.value = [];
  previewed.value = false;
  errorMessage.value = "";
};

const fillSample = (which: "old" | "new") => {
  rawText.value = which === "old" ? SAMPLE_OLD_POLICY : SAMPLE_NEW_POLICY;
  versionLabel.value = which === "old" ? "v2026.06" : "v2026.09";
  title.value = "示例产品隐私政策";
};

defineExpose({ reset });
</script>

<template>
  <div class="import-panel panel">
    <h2>导入新版政策</h2>
    <p class="panel-hint">粘贴整版政策正文，系统会自动按“一、/ 第 X 条 / 1.”切分条款并识别分类。</p>
    <div class="form-grid">
      <label>
        <span>政策标题</span>
        <input v-model="title" type="text" placeholder="留空则自动取正文标题" />
      </label>
      <label>
        <span>版本标签 *</span>
        <input v-model="versionLabel" type="text" placeholder="如 v2026.09 / 2026-09 版" />
      </label>
    </div>
    <label class="textarea-wrap">
      <span>政策正文 *</span>
      <textarea v-model="rawText" rows="12" placeholder="在此粘贴隐私政策全文…" />
    </label>
    <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
    <div class="import-actions">
      <button class="btn" :disabled="!canParse || parsing" @click="runParse">
        {{ parsing ? "解析中…" : "解析并预览分段" }}
      </button>
      <button class="btn primary" :disabled="!previewed || importing" @click="submit">
        {{ importing ? "导入中…" : "确认导入" }}
      </button>
      <button class="btn ghost" @click="reset">清空</button>
      <span class="sample-links">
        填充示例：<a @click="fillSample('old')">旧版</a> / <a @click="fillSample('new')">新版</a>
      </span>
    </div>

    <div v-if="previewed" class="parse-preview">
      <h3>分段预览（{{ drafts.length }} 条）</h3>
      <EmptyState v-if="drafts.length === 0" title="未识别到条款标题" hint="请确认正文中包含“一、”或“第一条”等编号" />
      <ul v-else>
        <li v-for="draft in drafts" :key="draft.match_key">
          <span class="preview-no">{{ draft.section_no }}</span>
          <span class="preview-heading">{{ draft.heading }}</span>
          <span class="preview-category">{{ SECTION_CATEGORY_TEXT[draft.category] }}</span>
          <RiskTag :level="draft.risk_level" size="sm" />
        </li>
      </ul>
    </div>
  </div>
</template>
