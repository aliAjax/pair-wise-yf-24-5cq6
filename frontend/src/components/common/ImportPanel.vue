<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { SAMPLE_POLICY_OPTIONS } from "../../mocks/seedData";
import { usePolicyParser } from "../../hooks/usePolicyParser";

const emit = defineEmits<{
  (event: "import", payload: { title: string; version_label: string; raw_text: string; compareWithLatest: boolean }): void;
}>();

const form = reactive({ title: "", version_label: "", raw_text: "" });
const compareWithLatest = ref(true);
const importing = ref(false);

const { preview, sectionCount, riskCounts } = usePolicyParser(() => form.raw_text);

const riskSummary = computed(() =>
  (["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const)
    .filter((level) => riskCounts.value[level] > 0)
    .map((level) => `${({ CRITICAL: "严重", HIGH: "高", MEDIUM: "中", LOW: "低" } as Record<string, string>)[level]} ${riskCounts.value[level]}`)
    .join(" · ")
);

function loadSample(versionLabel: string) {
  const sample = SAMPLE_POLICY_OPTIONS.find((option) => option.version_label === versionLabel);
  if (!sample) return;
  form.title = sample.title;
  form.version_label = `${sample.version_label}-演示${Date.now() % 1000}`;
  form.raw_text = sample.raw_text;
  ElMessage.success(`已载入示例 ${sample.version_label}，版本号已加后缀以避免重复`);
}

async function submit() {
  importing.value = true;
  try {
    emit("import", {
      title: form.title,
      version_label: form.version_label,
      raw_text: form.raw_text,
      compareWithLatest: compareWithLatest.value
    });
  } finally {
    importing.value = false;
  }
}

function reset() {
  form.title = "";
  form.version_label = "";
  form.raw_text = "";
}
</script>

<template>
  <div class="import-panel">
    <el-form label-position="top" :model="form">
      <div class="import-form-row">
        <el-form-item label="政策标题" class="flex-2">
          <el-input v-model="form.title" placeholder="例如：某服务隐私政策" clearable />
        </el-form-item>
        <el-form-item label="版本号" class="flex-1">
          <el-input v-model="form.version_label" placeholder="例如：v4.0" clearable />
        </el-form-item>
      </div>
      <el-form-item label="政策全文（粘贴文本，支持“第一条 / 1. / 一、”编号）">
        <el-input
          v-model="form.raw_text"
          type="textarea"
          :rows="10"
          placeholder="将整版隐私政策文本粘贴到这里，系统会自动按条款分段并标注风险"
        />
      </el-form-item>
      <div class="import-actions">
        <el-button type="primary" :loading="importing" @click="submit">导入并解析条款</el-button>
        <el-button @click="reset">清空</el-button>
        <el-checkbox v-model="compareWithLatest" border>导入后立即与最近一版对比</el-checkbox>
        <el-dropdown trigger="click" @command="loadSample">
          <el-button type="warning" plain>载入示例文本<el-icon class="el-icon--right">▾</el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="option in SAMPLE_POLICY_OPTIONS" :key="option.version_label" :command="option.version_label">
                {{ option.version_label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-form>

    <div v-if="sectionCount > 0" class="import-preview">
      <div class="import-preview-head">
        <strong>分段预览（{{ sectionCount }} 条）</strong>
        <span class="muted">自动风险标注：{{ riskSummary || "低 0" }}</span>
      </div>
      <el-scrollbar max-height="220px">
        <ul class="preview-list">
          <li v-for="item in preview" :key="`${item.section_no}-${item.heading}`">
            <span class="preview-no">{{ item.section_no }}</span>
            <span class="preview-heading">{{ item.heading }}</span>
            <el-tag size="small" :type="item.verdict.critical ? 'danger' : item.verdict.riskLevel === 'HIGH' ? 'warning' : 'info'">
              {{ item.verdict.category === "OTHER" ? "未分类" : item.verdict.matchedKeyword }}
            </el-tag>
          </li>
        </ul>
      </el-scrollbar>
    </div>
  </div>
</template>
