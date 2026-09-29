# 隐私政策差异对比器

纯前端隐私政策版本对比与风险标注工具：粘贴两版政策文本后按条款逐段列出差异，自动识别新增/移除/改动/移动条款，对新出现的数据收集、信息共享、保存期限条款标注风险高低；审查员可逐条确认改动并沉淀备注。再导入更新版本时，条款内容变过的已确认结论自动退回待处理，旧结论不再误用，历史备注原文保留。数据全部存于浏览器 localStorage。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

启动后访问：<http://localhost:20112>

首次打开会自动播种三版示例政策（v1.0 → v2.0 → v3.0），可直接体验「导入 → 对比 → 风险标注 → 审阅确认 → 再导入新版 → 确认失效、备注保留」完整主线。

## 审阅主线说明

1. **导入两版**（`/documents`）：粘贴政策全文，自动按「第一条 / 1. / 一、」编号分段，新条款即时给出数据收集/信息共享/保存期限等类别与低/中/高/严重风险初判，可勾选「导入后立即与最近一版对比」。
2. **版本对比**（`/compare`）：按条款逐段左右并排展示，差异类型（新增/移除/改动/移动/未变化）分色区分，改动条款提供逐字高亮；可按类型过滤、按条款展开处理。
3. **风险标注**（`/risks`）：复核/覆盖自动判定的类别与风险等级，支持仅看本版新增条款。
4. **审阅清单**（`/review`）：按待处理/已确认/已忽略/无需处理逐条处理，写备注、署名确认，一键导出 Markdown 摘要。
5. **再导入更新版时**：
   - 条款内容指纹未变 → 已确认/已忽略等结论**沿用**到新版本；
   - 条款内容变过（改动）→ 结论**自动退回待处理（OPEN）**，旧版本上的结论定格为历史，不会被当成新版本结论；
   - 无论结论是否失效，**历史审阅备注原文一律保留**，复制到新版本对应条款并标注「沿用上一版备注」。

## 本地开发方式

- 前端：`cd frontend && npm install && npm run dev`（默认端口 20112）
- 类型检查与构建：`cd frontend && npm run build`

## 访问地址

- 前端：<http://localhost:20112>
- 路由：`/documents`（文档导入）、`/compare`（版本对比）、`/risks`（风险标注）、`/review`（审阅清单）

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + TypeScript + Vite + Element Plus + Pinia + Vue Router |
| 后端 | 无（localStorage 分表持久化，`api/` 为按模型封装的 async 本地接口） |
| 数据 | 浏览器 localStorage（首次启动经真实解析/对比引擎播种示例数据） |
| 部署 | Docker Compose（多阶段构建 + Nginx，SPA fallback） |

## 项目目录结构

```text
frontend/src/
├── api/                  # 按模型分文件的 async API，底层走 localStorage（PolicyDocument/PolicySection/DiffResult/ReviewNote）
├── stores/               # Pinia 独立 store（文档、条款、差异、备注）
├── types/                # 数据模型与枚举的类型定义
├── constants/            # 枚举常量、风险规则、筛选器、日志模板、错误码/错误消息、状态文案
├── constructors/         # 各实体的默认对象/表单对象/响应对象构造器
├── components/common/    # 共享组件：ImportPanel/DiffViewer/RiskTag/ReviewChecklist/SectionCard/StatusBadge/EmptyState/...
├── hooks/                # useTextDiff / usePolicyParser / useLocalStorageState
├── pages/                # DocumentsPage / ComparePage / RisksPage / ReviewPage
├── router/               # vue-router 路由表
├── services/             # 业务规则：导入、对比生成、确认失效/沿用、备注继承、风险覆盖、导出、播种
├── utils/                # 分段解析、条款配对、逐字 diff、风险分类、内容指纹、日志、错误、localStorage、格式化
├── config/               # 全局配置（存储键、API 开关）
└── mocks/                # 三版示例政策文本与播种场景
```

## 核心数据模型

- **PolicyDocument**：id, title, version_label, raw_text, normalized_sections, imported_at
- **PolicySection**：id, document_id, section_no, heading, content, category, risk_level, content_hash, is_newly_added
- **DiffResult**：id, old/new_document_id, section_id, old_section_id, section_no, heading, diff_type, summary, content_hash, risk_level, status, superseded_by, created_at, reviewed_at, reviewer
- **ReviewNote**：id, diff_result_id, tag, comment, reviewer, status, inherited_from_note_id, created_at, updated_at

## 环境变量说明

- `COMPOSE_PROJECT_NAME`: Compose 项目名，默认 `policy-diff`
- `FRONTEND_PORT`: 前端端口，默认 `20112`

## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: policy-diff`。
- 容器名：`${COMPOSE_PROJECT_NAME:-policy-diff}-frontend`。
- 端口映射：`${FRONTEND_PORT:-20112}:80`；前端镜像为多阶段构建（Node 构建 → Nginx 托管）。
- `frontend/nginx.conf` 配置 `try_files $uri $uri/ /index.html;` 支持 SPA 路由（含中文目录名）。
- 纯前端无数据库卷；审阅数据在浏览器 localStorage 中，清理浏览器数据即可重置。
- 常见问题：端口占用时修改 `.env` 中端口后重启；需要重置示例数据时清除站点 localStorage（键前缀 `policy-diff:`）。

## 枚举/常量出现位置清单

### DiffType（ADDED / REMOVED / MODIFIED / MOVED / UNCHANGED）

- 类型：`types/DiffType.ts`
- 常量/文案：`constants/DiffType.ts`、聚合于 `constants/statusText.ts`
- 构造器：`constructors/DiffResultConstructor.ts`
- 日志/错误：`constants/logTemplates.ts`（regenerate/statusChange/invalidate/supersede）、`constants/errorMessages.ts`
- 业务与筛选：`utils/sectionMatcher.ts`、`utils/diffSummary.ts`、`constants/filters.ts`、`services/diffService.ts`、`services/exportService.ts`
- 展示组件/页面：`components/common/StatusBadge.vue`、`DiffViewer.vue`、`pages/ComparePage.vue`、`pages/ReviewPage.vue`、`utils/formatters.ts`

### PrivacyRiskLevel（LOW / MEDIUM / HIGH / CRITICAL）

- 类型：`types/PrivacyRiskLevel.ts`
- 常量/文案/排序：`constants/PrivacyRiskLevel.ts`、聚合于 `constants/statusText.ts`
- 构造器：`constructors/PolicySectionConstructor.ts`、`constructors/DiffResultConstructor.ts`
- 规则/日志：`constants/riskRules.ts`、`constants/logTemplates.ts`（riskOverride）
- 业务与筛选：`utils/riskClassifier.ts`、`utils/policyParser.ts`、`hooks/usePolicyParser.ts`、`pages/RisksPage.vue`
- 展示组件：`components/common/RiskTag.vue`、`SectionCard.vue`、`DiffViewer.vue`、`utils/formatters.ts`

### ReviewStatus（OPEN / CONFIRMED / IGNORED / RESOLVED）

- 类型：`types/ReviewStatus.ts`
- 常量/文案：`constants/ReviewStatus.ts`、聚合于 `constants/statusText.ts`
- 构造器：`constructors/ReviewNoteConstructor.ts`、`constructors/DiffResultConstructor.ts`
- 日志/错误：`constants/logTemplates.ts`（statusChange/invalidate/inherit）、`constants/errorMessages.ts`
- 业务与筛选：`services/diffService.ts`、`services/reviewNoteService.ts`、`constants/filters.ts`、`stores/DiffResultStore.ts`
- 展示组件/页面：`components/common/StatusBadge.vue`、`ReviewChecklist.vue`、`pages/ReviewPage.vue`、`pages/ComparePage.vue`、`utils/formatters.ts`

### SectionCategory（DATA_COLLECTION / INFORMATION_SHARING / RETENTION / USER_RIGHTS / SECURITY / CONTACT / OTHER）

- 类型：`types/SectionCategory.ts`；常量/文案：`constants/SectionCategory.ts`
- 规则：`constants/riskRules.ts`；分类：`utils/riskClassifier.ts`
- 标注页与卡片：`pages/RisksPage.vue`、`components/common/SectionCard.vue`、`utils/formatters.ts`

## 为什么会牵一发动全身

实体字段、枚举、日志模板、错误消息、构造器、风险规则、筛选器和展示组件被刻意拆散到多个目录。以「新增一个差异类型」为例，需要同步：`types/DiffType.ts` → `constants/DiffType.ts`（文案）→ `constants/filters.ts` → `sectionMatcher.ts`/`diffSummary.ts`（判定与摘要）→ `logTemplates.ts` → `formatters.ts` → 对比/审阅页面与 `DiffViewer.vue` 的配色，store 与构造器的默认值也要一并检查。核心规则「确认失效、备注保留」集中在 `services/diffService.ts` 的版本链继承逻辑，由内容指纹（`utils/hash.ts`）驱动，改动配对或指纹规则会同时影响差异分类、风险继承与历史归档。

## License

MIT
