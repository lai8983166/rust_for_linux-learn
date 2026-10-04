---
title: kernel crate 结构图谱
---

# kernel crate 结构图谱

::: info 占位
本文已规划，内容撰写中。以下为拟定大纲。
:::

## rust/kernel/ 目录地图

TODO: prelude、error、alloc、sync、device、types、net、fs 等模块的全景图（Mermaid）

## 关键类型工具箱

TODO: `Opaque<T>`（不透明 FFI 内存）、`AlwaysRefCounted`、`ARef`、newtype/transparent 模式

## 结构图谱与 bindings 的关系

TODO: 生成的 `bindings`/`bindings_helper` crate 与手写 `kernel` crate 的分层

## 如何读源码

TODO: 从 `rust/kernel/lib.rs` 出发的阅读路线；`rustdoc` 目标；以 6.x 实际源码为锚
