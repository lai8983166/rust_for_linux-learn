---
title: C↔Rust 映射速查表
---

# C↔Rust 映射速查表

::: info 占位
本文已规划，内容撰写中。以下为拟定大纲。
:::

## 内存与分配

TODO: `kmalloc`→`KBox`、`kcalloc`→`KVec`、`krealloc`、`kfree`→`Drop` 等对照行

## 错误与控制流

TODO: `-errno`/`ERR_PTR`→`Result`、`goto err`→`?` 与作用域 Drop 等对照行

## 同步与生命周期

TODO: `spin_lock`→guard、`refcount_t`→`ARef`/`Arc`、`list_head`→`List` 等对照行

## 设备与驱动

TODO: `platform_driver` 注册、probe/remove、devm 资源的对照行
