---
title: 内存分配：KBox/KVec 与 GFP
---

# 内存分配：KBox/KVec 与 GFP

::: info 占位
本文已规划，内容撰写中。以下为拟定大纲。
:::

## 为什么没有全局分配器

TODO: 内核分配天然可失败、依赖 GFP 上下文；与 std `Box`/`Vec` 假设的根本冲突

## Flags 作为类型状态的参数

TODO: `Flags` trait 与 `GFP_KERNEL`/`GFP_ATOMIC` 语义；为什么 GFP 不能省略

## KBox / KVec / KVec

TODO: 与 kmalloc/kcalloc/krealloc 的对应；fallible 分配 API 的形态

## Drop 与释放路径

TODO: RAII 释放；`devm` 托管分配的对照；泄漏即 bug 的编译器视角
