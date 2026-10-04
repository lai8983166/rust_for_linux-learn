# write-principles-ch1-3

## Why

教程站点的骨架与三个入门页已完成（见归档 change `2026-10-04-add-tutorial-site`），但原理篇 9 章全部还是占位页。教程的核心价值——原理深挖——尚未开始交付。需要先写前三章（理论地基），验证内容质量与风格，再决定后续节奏。

## What Changes

- 实写 `docs/principles/safety-philosophy.md`（安全抽象的哲学）：unsafe 的三种角色、soundness、类型编码不变量、分层责任、一个完整的微型包装例子
- 实写 `docs/principles/kernel-crate.md`（kernel crate 结构图谱）：`rust/kernel/` 目录地图（Mermaid）、`Opaque`/`AlwaysRefCounted`/`ARef` 工具箱、与 `bindings` 的分层、源码阅读路线
- 实写 `docs/principles/error-handling.md`（错误处理）：C 的 `-errno`/`ERR_PTR` 惯用法、`kernel::error` 设计、双语言 diff 对照、`?` 传播
- 三章的 API 事实对照 torvalds/linux master 树逐项核实，页内以 VersionBadge 标注锚点版本

## Capabilities

### New Capabilities

- `principles-content`: 原理篇章节的内容契约——每章必须覆盖的主题、必须包含的代码示例类型、API 事实必须锚定真实内核源码、页内版本锚定标注

### Modified Capabilities

（无——`tutorial-site` 的站点行为契约不变，本 change 只是把既有占位页填实，不改导航与结构）

## Impact

- 仅改动 `docs/principles/` 下三个 Markdown 文件
- 不改配置、主题、侧边栏（页面路径与标题已在上一 change 定型）
- 新增对外事实来源依赖：torvalds/linux master 树（GitHub raw）
