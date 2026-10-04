---
title: 错误处理：Result 与 errno
---

# 错误处理：Result 与 errno

::: info 占位
本文已规划，内容撰写中。以下为拟定大纲。
:::

## 从 errno 说起

TODO: C 内核的 `-errno`/`IS_ERR`/`PTR_ERR` 惯用法及其易错点

## kernel::error 的设计

TODO: `Error` 的码表模型、`From<i32>`、`to_result()`、`Result<T, Error>` 别名

## 两套世界观的映射

TODO: 错误码 ↔ Result；指针哨兵值 ↔ Option/Result；diff 对照展示同一段逻辑的 C 与 Rust 写法

## 传播与人体工学

TODO: `?` 运算符在内核代码中的形态；错误码常量；与 `try_` 宏家族的关系
