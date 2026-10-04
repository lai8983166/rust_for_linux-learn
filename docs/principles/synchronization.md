---
title: 同步原语的 RAII 封装
---

# 同步原语的 RAII 封装

::: info 占位
本文已规划，内容撰写中。以下为拟定大纲。
:::

## guard 即临界区

TODO: `lock()` 返回 guard、guard 的生命周期就是持锁区间的设计；忘记解锁如何变成不可写的代码

## SpinLock / Mutex / CondVar

TODO: 构造函数、`new().pin_init()` 形态、与 C 侧 `spin_lock_t` 等的对应

## 跨越边界

TODO: guard 不能存进结构体、不能跨 `.await`/回调的规则及其原因

## C 与 Rust 对照

TODO: 同一段生产者-消费者逻辑的双语言实现 diff
