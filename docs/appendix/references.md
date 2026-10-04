---
title: 参考文献
---

# 参考文献

按用途分三类。所有链接为官方或长期稳定的社区资源；内核树链接指向 master（滚动），配合各章的版本锚定徽章使用。

## 官方文档

- [内核 Rust 文档（docs.kernel.org，next 树）](https://docs.kernel.org/next/rust/) —— 快速开始、一般信息、编码规范、架构支持、测试五篇，本教程快速上手章的事实锚点
- [rust-for-linux 项目官网](https://rust-for-linux.com/) —— 项目首页，链接到贡献指南与历史演讲
- [torvalds/linux 源码树 rust/ 目录](https://github.com/torvalds/linux/tree/master/rust) —— 一切的最终事实来源；本教程全部 API 的锚定处
- [elixir.bootlin.com 的 rust/ 视图](https://elixir.bootlin.com/linux/latest/source/rust) —— 带交叉引用与检索的源码浏览，日常查阅最顺手
- [内核文档总入口](https://docs.kernel.org/) —— 进程、子系统、API 手册
- [Rust 官方 Pin 文档](https://doc.rust-lang.org/std/pin/index.html) —— `Pin`/`Unpin` 的语言层背景（第 5 章预备）

## 邮件列表与讨论

- [rust-for-linux 邮件列表（lore 存档）](https://lore.kernel.org/rust-for-linux/) —— 补丁评审、设计讨论的主场，学"真正的工程对话"去这里
- [LKML（lore 存档）](https://lore.kernel.org/lkml/) —— Rust 合入主线的历次大讨论都在此留档
- [Linux Plumbers Conference](https://lpc.events/) —— 历年 Rust in Linux 微会议的议程与视频入口

## 演讲与文章

- [LWN.net 内核 Rust 专题索引](https://lwn.net/Kernel/Index/#Rust) —— LWN 对 Rust 入内核全程的深度跟踪报道，历史脉络最权威的二手来源
- [Greg Kroah-Hartman：Rust will save Linux from AI（Rust 用户论坛讨论帖）](https://users.rust-lang.org/) —— 2026 年稳定版维护者谈内存安全语言在 AI 产码时代的必要性（引子章的素材）
- 中文资料：知乎"神仙打架：Rust 入内核"系列梳理了 2020 RFC 以来的社区争论史；36kr《5 年了，Rust 终于在 Linux 内核中"转正"了》是时间线的好摘要——中文二手资料普遍滞后于 master 树，**读时请以本教程各章的版本锚定为准**

## 本教程的引用约定

正文每章顶部的版本徽章标注该章 API 事实对照的源码树与检索日期；与上述资源冲突时，以源码树（`rust/` 目录）为准。发现正文与最新 master 出入，欢迎提 issue 修正——版本锚定的意义就在于让它过时得明明白白。
