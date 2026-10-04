## Context

空仓库（仅 `openspec/`、`.agents/`、`.claude/` 工作流文件），Windows 10 + bash，Node v24 / pnpm 10.4 / git 2.41 可用。需求见 proposal.md；行为契约见 specs/tutorial-site/spec.md。关键外部约束：`vitepress-plugin-mermaid@2.x` 的 peer 依赖为 `mermaid 10||11`（最新 12 不兼容）；pnpm 安装该插件需 `shamefully-hoist`；Shiki（VitePress 1.6 内置）不携带 kconfig/dts 语法。

## Goals / Non-Goals

**Goals:**

- 确定性脚手架：直接写文件 + 一次安装，不依赖交互式 `vitepress init`
- 中文搜索真正可用（CJK 分词），而非"能弹出框但搜不到中文"
- 版本锚定成为内容基础设施（组件化，而非每页手写）
- 构建即门禁：死链、配置错误在 CI/本地构建阶段暴露

**Non-Goals:**

- 部署（GitHub Pages/Vercel、`base` 路径、workflow 文件）——后续独立 change
- 12 个占位章节的正文撰写——本 change 只交付大纲级 stub
- 英文多语言（`/en/` locale）——单语言站点
- 教程配套示例代码仓库

## Decisions

**D1：VitePress ^1.6.4（而非 2.0-RC 或 mdBook/Astro）**
用户已选定 VitePress。锁 1.x 稳定版：2.0 尚为 RC，插件生态（mermaid 插件）明确只支持 `^1.0.0`。mdBook 图文排版弱、Astro 定制成本高（见 proposal 阶段讨论）。

**D2：mermaid 锁 ^11（而非最新 12）**
`vitepress-plugin-mermaid@2.0.17` peer 要求 `mermaid "10 || 11"`。装 12 会 peer 冲突。升级路径：等插件发 12 支持。

**D3：pnpm + `.npmrc(shamefully-hoist=true)`（而非 npm）**
插件 README 明确 pnpm 需 hoist 才能解析 mermaid。`.npmrc` 必须在首次 `pnpm install` 前写入——脚手架顺序敏感。备选 npm 无此问题，但锁一个包管理器避免 lockfile 混用。

**D4：中文搜索用 `Intl.Segmenter` 自定义分词**
VitePress local search 默认 MiniSearch 空白分词，中文整段成单 token，搜索形同虚设。`Intl.Segmenter('zh-CN')` Node 24 原生支持，零依赖。备选：引入 jieba-wasm（多一个依赖，收益有限）。

**D5：Kconfig 片段用 `ini`、设备树用 `c` 高亮**
Shiki 内置语法无 kconfig/dts；未知语言会退化为纯文本并告警。ini 语义上最接近 Kconfig 的 `CONFIG_X=y` 形态。

**D6：自定义组件保持零依赖**
`VersionBadge.vue`、`KernelTerm.vue` 用 props + scoped CSS 实现，不引图标库。组件经 theme `enhanceApp` 全局注册，Markdown 中直接使用。

**D7：占位页零内部链接**
VitePress 默认死链构建失败（保留作为门禁，不设 `ignoreDeadLinks`）。占位页只含标题 + info 容器 + H2 大纲，导航所需的链接全部收敛在 config 侧边栏（指向真实存在的文件）。

**D8：git 仓库在脚手架阶段即初始化 + 增量提交**
`lastUpdated: true` 依赖 git 提交时间戳；用户要求每完成一小块工作即提交。提交粒度：脚手架 → 配置与主题 → 3 个实写页 → 12 个占位页 → 收尾。

**D9：不设 `base`**
本地优先；GitHub Pages 部署时属项目页需 `/rust_for_linux-learn/`，届时再加（部署属 Non-Goal）。

## Risks / Trade-offs

- [Node 24 运行 vite 5.4（官方目标 ≤22）可能异常] → 预案：切 Node 22 LTS 重试 dev server；build 走静态编译通常无碍
- [mermaid 客户端渲染，curl/无头校验只能验证容器存在，不能验证像素] → 验证策略：构建产物含 mermaid 容器标记 + 人工浏览器抽查（面向用户步骤）
- [pnpm 10 对无 postinstall 需求的包打印 build-script 警告] → 无害，忽略
- [12 个占位章节可能长期停留] → 页面带"撰写中"声明 + 本 change 归档后按章开后续 change

## Migration Plan

全新仓库，无迁移。回滚 = 删除 `docs/`、`package.json`、`.npmrc`、`node_modules/`、git 历史（或重建分支）。
