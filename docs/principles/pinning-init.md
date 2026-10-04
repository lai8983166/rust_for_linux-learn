---
title: Pinning 与就地初始化
---

# Pinning 与就地初始化

::: info 占位
本文已规划，内容撰写中。以下为拟定大纲。
:::

## 内核对象为什么不能移动

TODO: 自引用、链表成员资格、回调里持有的裸指针；move 语义与内核对象生命周期的根本冲突

## Pin 入门

TODO: `Pin<&T>`、`!Unpin`、`PhantomPinned`；标准库 Pin 与内核场景的差异

## #[pin_data] 与 pin-init API

TODO: `pin_init!`/`try_pin_init!` 宏；就地构造如何绕开"先建后钉"的两难

## Opaque 与未初始化内存

TODO: `Opaque<T>` 承载未初始化状态；初始化完成前类型系统如何阻止误用

## 为什么这是内核 Rust 最硬核的部分

TODO: 与标准库初始化模型的对比；字段投影（field projections）缺失带来的复杂度
