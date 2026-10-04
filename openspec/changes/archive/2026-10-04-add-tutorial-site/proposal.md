# add-tutorial-site

## Why

中文社区缺少系统讲解 Linux 内核 Rust 支持（Rust for Linux）的教程，且内核 Rust API 演进极快、存量资料普遍过时。需要一个新的、原理深挖导向的中文图文教程站点，并从第一天起以"验证过的版本锚定"作为内容可信度的核心手段。

## What Changes

- 新增 VitePress 站点（中文、纯静态、暗色模式、Mermaid 图表、中文本地搜索）
- 新增站点骨架：`docs/` 目录、`.vitepress` 配置、自定义主题（`VersionBadge` 版本徽章、`KernelTerm` 中英术语组件）
- 新增 15 个教程页面：首页 + 开始（2 页：引子、快速上手）+ 原理篇（9 页）+ 展望/附录（4 页）
- 首轮实写 3 页（首页、引子、快速上手），其余 12 页为带大纲的占位页
- 新增项目工程文件：`package.json`、`.npmrc`（pnpm shamefully-hoist）、`.gitignore`，并初始化 git 仓库（`lastUpdated` 依赖 git 时间戳）

## Capabilities

### New Capabilities

- `tutorial-site`: 教程站点的构建与表现——VitePress 构建、站点导航/侧边栏结构、中文本地搜索（CJK 分词）、Mermaid 图表渲染、自定义组件（版本徽章、术语标注）、死链零容忍的构建门禁

### Modified Capabilities

（无——全新项目，无既有能力）

## Impact

- 新增依赖：`vitepress@^1.6.4`、`vitepress-plugin-mermaid@^2.0.17`、`mermaid@^11`（注意：mermaid 12 与插件 peer 范围冲突，必须锁 ^11）
- 新增 git 仓库与增量提交工作流
- 不影响 `openspec/`、`.agents/`、`.claude/` 既有工作流文件
- 部署（GitHub Pages/Vercel）为后续独立 change，本轮本地优先
