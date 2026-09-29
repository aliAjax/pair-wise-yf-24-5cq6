# 隐私政策差异对比器

纯前端隐私政策版本对比与风险标注工具：导入两版政策后按条款逐段列出新增、移除与改动，对数据收集 / 信息共享 / 保存期限等新条款自动标出风险高低，并支持法务逐条审阅、确认、写备注与导出 Markdown 摘要。所有数据保存在浏览器 localStorage，不接入任何第三方 API。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

启动后访问：<http://localhost:20112>

首次打开会自动播种两版示例政策（v2026.06 / v2026.09）及一条「已确认」的保存期限审阅备注，可直接走通「对比 → 审阅确认 → 再导入一版 → 确认退回」主线。

## 核心审阅主线

1. **文档导入（/documents）**：粘贴政策全文与版本标签，系统按「一、 / 第 X 条 / 1.」自动分段、识别分类并给出风险初判；勾选两个版本发起对比。
2. **版本对比（/compare）**：按条款编号（match_key）跨版本对齐，逐段列出 **新增 / 移除 / 改动**，支持差异类型、风险等级、关键词过滤与跳转段落；改动处为行级 + 字符级双高亮。
3. **风险标注（/risks）**：对数据收集、信息共享、保存期限三类重点条款人工改判分类与风险等级（新条款规则：数据收集 / 信息共享 = 高，保存期限 = 中）。
4. **审阅清单（/review）**：按状态处理变化条款、写备注、确认 / 忽略 / 解决，并导出 Markdown 摘要。

### 确认退回（版本更新后旧结论如何处理）

- 每条差异保存所审条款的**内容指纹（content_hash）**，审阅备注按条款 `match_key` 归属。
- 审查员确认某条改动后，再导入更新版政策并重新对比：
  - 条款内容**又变过** → 历史「已确认 / 已解决」结论**自动退回待处理（OPEN）**并标记“确认后被改动”，旧结论不再被当成新版本结论；
  - 条款内容**没变** → 结论原样保留；
  - 无论是否退回，**已写下的审阅备注全部保留**并跟随到新版本的差异条目，可继续追加意见。

## 本地开发方式

```bash
cd frontend && npm install && npm run dev
```

类型检查与生产构建：

```bash
cd frontend && npm run build   # vue-tsc --noEmit && vite build
```

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + TypeScript + Vite + Pinia + vue-router + Element Plus |
| UI | Element Plus（全局注册）+ 页面级原生 CSS |
| 状态持久化 | localStorage（api 层按实体分文件封装 async 接口） |
| 差异算法 | 自研 LCS 行级对齐 + token 级行内高亮（`hooks/useTextDiff`） |
| 部署 | Docker Compose（Nginx 托管 SPA） |

## 项目目录结构

```text
frontend/src/
├── api/                  # 按模型分文件的 async API（底层为 localStorage）
│   └── localStorage.ts   # 通用读写 / 自增 ID / 可用性检查
├── stores/               # Pinia 独立 store：导入、对比退回、风险改判、审阅
├── types/                # 数据模型与枚举类型
├── constants/            # 枚举、文案、风险规则、日志模板、错误码与错误消息
├── constructors/         # 默认对象 / 表单对象 / 落库对象 / 差异构造器
├── components/common/    # ImportPanel DiffViewer RiskTag ReviewChecklist SectionCard ...
├── hooks/                # usePolicyParser / useTextDiff / useLocalStorageState
├── pages/                # Documents Compare Risks Review 四个路由页面
├── router/               # 路由表（hash 模式，保证任意目录名部署可刷新）
├── services/             # diffEngine（对齐/风险/确认退回）、exportMarkdown
├── utils/                # formatters / logger / errors / hash
└── mocks/                # 示例政策原文、种子数据与首次播种 bootstrap
```

## 环境变量说明

- `COMPOSE_PROJECT_NAME`：Compose 项目名，默认 `policy-diff`
- `FRONTEND_PORT`：前端端口，默认 `20112`

## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: policy-diff`。
- 容器名使用 `${COMPOSE_PROJECT_NAME:-policy-diff}-frontend`，端口映射 `${FRONTEND_PORT:-20112}:80`。
- 纯前端应用无数据库卷；数据存于浏览器 localStorage，清理浏览器站点数据即重置，也可在页面删除版本。
- Nginx 已配置 `try_files $uri $uri/ /index.html;`，并使用 hash 路由，可在中文等任意目录名下启动与刷新。
- 常见问题：端口占用时修改 `.env` 中 `FRONTEND_PORT` 后 `docker compose up -d`；镜像需要重建时执行 `docker compose up -d --build`。

## 枚举 / 常量出现位置清单

### DiffType（ADDED / REMOVED / MODIFIED / MOVED / UNCHANGED）

| 层 | 位置 |
|---|---|
| 类型 | `types/DiffType.ts` |
| 常量/文案/筛选顺序 | `constants/DiffType.ts`（`DIFF_TYPES`、`DIFF_TYPE_TEXT`、`DIFF_TYPE_FILTERS`） |
| 聚合文案 | `constants/statusText.ts` |
| 构造器 | `constructors/DiffResultConstructor.ts` |
| 引擎/日志 | `services/diffEngine.ts`（`alignSections` 产出分类）、`constants/logTemplates.ts`（DiffResult.REOPEN/CREATE） |
| 错误消息 | `constants/errorMessages.ts`（SAME_VERSION_COMPARE 等由 `utils/errors.ts` 包装） |
| 格式化 | `utils/formatters.ts`（`formatDiffType`） |
| 筛选器 | `pages/ComparePage.vue`（类型 chips） |
| 展示组件 | `components/common/StatusBadge.vue`、`DiffViewer.vue`、`pages/ReviewPage.vue`、`services/exportMarkdown.ts` |

### PrivacyRiskLevel（LOW / MEDIUM / HIGH / CRITICAL）

| 层 | 位置 |
|---|---|
| 类型 | `types/PrivacyRiskLevel.ts` |
| 常量/文案/色板 | `constants/PrivacyRiskLevel.ts`（`RISK_LEVELS`、`RISK_LEVEL_TEXT`、`RISK_LEVEL_TONE`、`RISK_LEVEL_FILTERS`） |
| 分类风险规则 | `constants/SectionCategory.ts`（`NEW_SECTION_RISK_RULE`、`CATEGORY_KEYWORDS`） |
| 聚合文案 | `constants/statusText.ts` |
| 构造器 | `constructors/PolicySectionConstructor.ts`、`constructors/DiffResultConstructor.ts` |
| 日志 | `constants/logTemplates.ts`（PolicySection.RECLASSIFY） |
| 格式化 | `utils/formatters.ts`（`formatRisk`） |
| 筛选器 | `pages/ComparePage.vue`、`pages/RisksPage.vue` |
| 展示组件 | `components/common/RiskTag.vue`、`SectionCard.vue`、`ImportPanel.vue`（分段预览）、`services/exportMarkdown.ts` |

### ReviewStatus（OPEN / CONFIRMED / IGNORED / RESOLVED）

| 层 | 位置 |
|---|---|
| 类型 | `types/ReviewStatus.ts` |
| 常量/文案 | `constants/ReviewStatus.ts`（`REVIEW_STATUSES`、`REVIEW_STATUS_TEXT`、`REVIEW_STATUS_REOPENED`、`REVIEW_STATUS_FILTERS`） |
| 聚合文案 | `constants/statusText.ts` |
| 构造器 | `constructors/ReviewNoteConstructor.ts` |
| 引擎/退回 | `services/diffEngine.ts`（`reconcileReviewState`）、`api/ReviewNote.ts`（`patchReviewNotes`） |
| 日志 | `constants/logTemplates.ts`（ReviewNote.STATUS_CHANGE、DiffResult.REOPEN） |
| 错误消息 | `constants/errorMessages.ts`（REVIEWER_REQUIRED） |
| 格式化 | `utils/formatters.ts`（`formatReviewStatus`） |
| 筛选器 | `pages/ReviewPage.vue`（状态 chips、仅看被退回） |
| 展示组件 | `components/common/StatusBadge.vue`、`ReviewChecklist.vue` |

### SectionCategory（DATA_COLLECTION / INFORMATION_SHARING / RETENTION / USER_RIGHTS / CONTACT / OTHER）

类型 `types/SectionCategory.ts`；规则与关键词 `constants/SectionCategory.ts`；识别逻辑 `hooks/usePolicyParser.ts`；改判 `pages/RisksPage.vue`、`stores/PolicySectionStore.ts`；展示 `StatusBadge.vue`、`SectionCard.vue`、`exportMarkdown.ts`。

## 为什么该项目会牵一发动全身

实体字段、枚举、日志模板、错误码 / 错误消息、构造器、风险规则、格式化函数、筛选器与展示组件被刻意拆分到多个目录并被多层直接引用。以「确认退回」为例，一次需求改动同时触达：`types/ReviewNote.ts`、`constants/ReviewStatus.ts`、`services/diffEngine.ts`、`api/ReviewNote.ts`、`stores/DiffResultStore.ts`、`stores/ReviewNoteStore.ts`、`components/common/ReviewChecklist.vue` 以及 Compare / Review 两个页面。新增一个差异类型或风险等级，也必须同步类型、常量文案、引擎、构造器、日志模板、格式化、筛选 chips 与展示组件。

## License

MIT
