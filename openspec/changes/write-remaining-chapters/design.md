## Context

前三章已建立写作模式（徽章锚定 → 动机 → 概念 → 对照示例 → 小结钩子）并验证质量。剩余 10 页沿用该模式。`principles-content` spec 的既有四条要求继续适用，本 change 追加"全部实写 + 附录完整"要求。见 proposal 与 specs delta。

## Goals / Non-Goals

**Goals:**

- 10 页全部成文，全站无占位残留，教程首轮内容闭环
- 后六章 API 事实全部对照 master 树核实（尤其：第三章示例里用过的 `KVec::with_capacity` 必须复核签名，错了要回头改正文）
- 附录三页达到"可独立使用的工具页"标准

**Non-Goals:**

- 教程配套示例代码仓库
- 英文版、部署（GitHub Pages 等）
- 后续增补章节（如文件系统、网络驱动专题）

## Decisions

**D1：研究批次并行化**
按主题分两批并行核实（alloc+sync 一批，pin-init+device 一批，build-system 单独一批），每批 2-3 个文件，控制检索轮次。

**D3：错误事实回改**
若核实发现已发布章节（1-3）与源码不符（高风险点：`KVec::with_capacity`、`SpinLock::new` 形态），立即回改对应章节并在提交说明中注明。

**D2：附录在正文之后写**
映射表与术语表依赖正文实际讲授的 API 与标注的术语全集，必须在第 4-9 章定稿后汇总生成，避免两处漂移。

**D4：device-model 作为合流章**
该章正文显式回指前八章概念（Opaque、ARef、pin-init、GFP、guard、Result），承担"综合复习"角色，这是原大纲的设计意图。

**D5：一章一提交 + 附录一提交 + 归档一提交**
共约 8 个内容提交。

## Risks / Trade-offs

- [build-system 章涉及 Kbuild 细节，公开文档薄] → 优先引证 rust/Makefile 与 bindings_helper.h 原文，宁粗勿错；不确定的机制表述为"以 Makefile 为准"并给链接
- [pin-init 宏细节复杂] → 聚焦"为什么需要"与使用形态，宏展开原理点到为止
- [一次 10 页篇幅大] → 章间独立提交，出问题可单独 revert

## Migration Plan

纯内容填充。任一章不满意单独 revert 对应提交即可。
