## Context

教程骨架与站点行为契约已交付（见 `openspec/specs/tutorial-site/`）。本 change 只填充 `docs/principles/` 前三章正文，不改站点结构。内容质量风险是主要的：内核 Rust API 演进快、凭记忆写极易过时或写错。

## Goals / Non-Goals

**Goals:**

- 三章正文内容准确：API 名称、签名、路径对照 torvalds/linux master 树逐项核实
- 叙述重心是设计动机（"为什么"），不是 API 手册式罗列
- 每章建立可复用的写作模式：版本锚定徽章 → 概念 → 对照示例 → 小结

**Non-Goals:**

- 后续六章（allocation/pinning/unstable/sync/device-model/build-system）
- 可编译的示例代码仓库（示例是页面内代码块，非独立 crate）
- 术语表页的正式填写（本 change 只保证三章内术语译法自洽，术语表全面整理留给后续 change）

## Decisions

**D1：事实来源 = GitHub 上 torvalds/linux master 树（raw 文件）**
直接取 `rust/kernel/lib.rs`、`error.rs`、`types/` 等文件核实，而非依赖二手教程。锚点在页内徽章标注为"master 树 + 检索日期"（不虚构具体内核版本号——master 是滚动树）。

**D2：三章共用一个写作骨架**
徽章（锚定）→ 动机段落 → 概念展开（术语组件标注）→ Rust/C 对照代码 → 小结与下一章钩子。降低读者跨章认知成本，也便于后续章节复用。

**D3：代码示例以"内核风格"为准但允许简化**
示例遵循内核源码的风格（Safety 注释、`KernelModule` trait 形态等），但允许省略与本节主题无关的样板；省略处用注释标明。不为凑完整可编译而稀释主题。

**D4：Mermaid 用于分层与数据流，不用于装饰**
第二章的 crate 分层图是硬需求；时间线已在引子页出现过，三章内不重复。

**D5：一章一提交 + 归档收尾提交**
延续增量提交约定：`docs: write principles chapter N ...` ×3 + tasks 勾选与归档各一笔。

## Risks / Trade-offs

- [master 树滚动，读者读到时 API 可能已变] → 徽章显式标注检索日期；关键 API 用法尽量选已稳定多版的形态
- [WebFetch 摘要可能丢失源码细节] → 对关键文件拉原文核对；拿不准的细节宁可少写、链接到源码，不编造
- [三章连写篇幅大，单次 review 负担重] → 章间提交切分，可按章 review

## Migration Plan

纯内容新增，无迁移。任一章不满意可单独 revert 对应提交。
