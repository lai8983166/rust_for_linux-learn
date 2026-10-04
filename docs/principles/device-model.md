---
title: 设备模型与驱动抽象
---

# 设备模型与驱动抽象

::: info 占位
本文已规划，内容撰写中。以下为拟定大纲。
:::

## 平台驱动抽象

TODO: platform driver 的 probe/remove 生命周期如何映射为 trait 与注册框架

## 资源管理

TODO: devm 风格的托管资源；`Registration` 模式；irq/iomem/request 的安全封装

## 最小 Rust 平台驱动

TODO: 一个完整可编译的 GPIO 风格示例，与等价 C 驱动并排对照

## 综合：前面八章概念的一次合流

TODO: 指出该示例中每一处用到的安全抽象、pinning、错误处理与分配设计
