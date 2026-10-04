---
title: 安全抽象的哲学
---

# 安全抽象的哲学

::: info 占位
本文已规划，内容撰写中。以下为拟定大纲。
:::

## unsafe 是边界，不是罪名

TODO: Rust 的 unsafe 语义；内核里 unsafe 的三种角色（绑定层、抽象层内部、驱动中的显式豁免）

## "安全 API 包裹健全的 unsafe 内部"

TODO: soundness（健全性）的定义；为什么安全抽象的目标是让驱动代码零 unsafe

## 把不变量编码进类型

TODO: 用类型系统表达"持有锁才能访问"、"引用计数管理生命周期"；newtype 模式

## 为什么"裸 unsafe 驱动"不是目标

TODO: 与直接写 C 相比毫无优势；分层责任：bindings → kernel crate → 驱动

## 一个完整的微型例子

TODO: 把一个虚构的 C 函数包装成不可能被误用的安全 API，展示错误用法如何变成编译错误
