---
title: 构建系统：Kbuild 与 bindgen
---

# 构建系统：Kbuild 与 bindgen

::: info 占位
本文已规划，内容撰写中。以下为拟定大纲。
:::

## .rs 如何变成内核产物

TODO: Kbuild 对 .rs → .o/rlib 的编译规则；`Makefile` 与 `Kbuild` 中的 Rust 支持入口

## bindgen 的工作方式

TODO: 输入（UAPI 头文件）、allowlist 约束、生成的 `bindings` crate 形态

## crate 依赖图

TODO: `kernel`、`macros`、`bindings`、`uapi` 的分层（Mermaid 图）

## C ↔ Rust 符号桥接

TODO: `EXPORT_SYMBOL_GPL` 与 `extern "C"` 的对接；rustc 编译 flag 中的内核定制项
