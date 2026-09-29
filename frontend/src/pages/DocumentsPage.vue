<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import ImportPanel from "../components/common/ImportPanel.vue";
import SectionCard from "../components/common/SectionCard.vue";
import EmptyState from "../components/common/EmptyState.vue";
import StatCard from "../components/common/StatCard.vue";
import { usePolicyDocumentStore } from "../stores/PolicyDocumentStore";
import { useDiffResultStore } from "../stores/DiffResultStore";
import { useReviewNoteStore } from "../stores/ReviewNoteStore";
import { formatDate } from "../utils/formatters";

const router = useRouter();
const documentStore = usePolicyDocumentStore();
const diffStore = useDiffResultStore();
const noteStore = useReviewNoteStore();

const expandedId = ref<number | null>(null);
const importing = ref(false);

onMounted(async () => {
  await documentStore.load();
});

const documents = computed(() => documentStore.sorted);
const totalSections = computed(() => documentStore.sections.length);

async function handleImport(payload: {
  title: string;
  version_label: string;
  raw_text: string;
  compareWithLatest: boolean;
}) {
  importing.value = true;
  try {
    const previous = documentStore.latest;
    const result = await documentStore.importDocument(payload);
    ElMessage.success(`导入成功：解析出 ${result.sections.length} 个条款`);

    if (payload.compareWithLatest && previous) {
      await diffStore.load();
      await noteStore.load();
      const pair = await diffStore.compare(previous.id, result.document.id);
      const reopened = pair.diffs.filter(
        (diff) => diff.status === "OPEN" && diff.diff_type !== "ADDED"
      ).length;
      ElMessage.success(
        `已与「${previous.version_label}」对比：新增 ${pair.diffs.filter((d) => d.diff_type === "ADDED").length} 条、改动 ${pair.diffs.filter((d) => d.diff_type === "MODIFIED").length} 条、移除 ${pair.diffs.filter((d) => d.diff_type === "REMOVED").length} 条${reopened ? `；${reopened} 条历史确认已退回待处理` : ""}`
      );
      await router.push({ path: "/compare", query: { from: String(previous.id), to: String(result.document.id) } });
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "导入失败");
  } finally {
    importing.value = false;
  }
}

async function removeDocument(id: number, version: string) {
  try {
    await ElMessageBox.confirm(`确定删除版本「${version}」？相关条款、差异与审阅备注将一并清理。`, "删除确认", {
      type: "warning"
    });
    await documentStore.removeDocument(id);
    await diffStore.load();
    await noteStore.load();
    ElMessage.success("已删除");
  } catch {
    // 用户取消
  }
}

function toggle(id: number) {
  expandedId.value = expandedId.value === id ? null : id;
}
</script>

<template>
  <div class="page-inner">
    <header class="page-title">
      <div>
        <p class="eyebrow">STEP 1 · IMPORT</p>
        <h2>文档导入</h2>
        <p class="subtitle">粘贴两版隐私政策文本，系统自动按条款分段，并对新出现的数据收集、信息共享、保存期限条款标注风险。</p>
      </div>
    </header>

    <section class="metrics metrics-3">
      <StatCard label="已导入版本" :value="documents.length" />
      <StatCard label="解析条款总数" :value="totalSections" />
      <StatCard label="已生成版本对" :value="new Set(diffStore.rows.map((d) => `${d.old_document_id}-${d.new_document_id}`)).size" />
    </section>

    <section class="panel">
      <h3>导入新版本</h3>
      <ImportPanel @import="handleImport" :style="{ pointerEvents: importing ? 'none' : 'auto' }" />
    </section>

    <section class="panel">
      <h3>版本列表</h3>
      <EmptyState
        v-if="documents.length === 0"
        title="还没有导入任何政策版本"
        description="在上方粘贴文本或点击“载入示例文本”开始"
      />
      <ul v-else class="document-list">
        <li v-for="doc in documents" :key="doc.id" class="document-item">
          <div class="document-main" @click="toggle(doc.id)">
            <div>
              <strong>{{ doc.title }}</strong>
              <el-tag size="small" class="version-tag">{{ doc.version_label }}</el-tag>
            </div>
            <div class="document-meta">
              <span>{{ doc.normalized_sections }} 个条款</span>
              <span class="muted">导入于 {{ formatDate(doc.imported_at) }}</span>
            </div>
          </div>
          <div class="document-ops">
            <el-button size="small" @click="toggle(doc.id)">{{ expandedId === doc.id ? "收起条款" : "查看条款" }}</el-button>
            <el-button size="small" type="danger" plain @click="removeDocument(doc.id, doc.version_label)">删除</el-button>
          </div>
        </li>
      </ul>

      <el-collapse-transition>
        <div v-if="expandedId !== null" class="document-sections">
          <SectionCard
            v-for="section in documentStore.sectionsOf(expandedId)"
            :key="section.id"
            :section="section"
          />
        </div>
      </el-collapse-transition>
    </section>
  </div>
</template>
