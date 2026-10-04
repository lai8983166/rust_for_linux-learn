---
title: P2：第一个模块
---

# P2：第一个模块

目标很小但仪式感拉满：在内核树里给 rustyring 安一个家，让 `insmod` 之后 `dmesg` 里出现我们的问候，`rmmod` 之后出现告别。走完这章，"内核 Rust 模块如何存在"就不再是抽象问题——后面四章都只是往这个骨架上添肉。

<VersionBadge label="本文锚定" kernel="master 树" date="2026-10" />

> 代码形态对照 [`samples/rust/rust_minimal.rs`](https://github.com/torvalds/linux/blob/master/samples/rust_minimal.rs)与 [`rust_misc_device.rs`](https://github.com/torvalds/linux/blob/master/samples/rust/rust_misc_device.rs)核实（2026-10 检索）。

## 在内核树里安家

进入你[快速上手](/quick-start/environment)时准备的内核树，创建 `samples/rust/rustyring.rs`：

```rust
// SPDX-License-Identifier: GPL-2.0

//! rustyring：环形缓冲字符设备（实战篇成果物，随连载生长）。

use kernel::prelude::*;

module! {
    type: Rustyring,
    name: "rustyring",
    authors: ["Rust for Linux 学习者"],
    description: "环形缓冲 misc 字符设备",
    license: "GPL",
}

struct Rustyring;

impl kernel::InPlaceModule for Rustyring {
    fn init(_module: &'static ThisModule) -> impl PinInit<Self, Error> {
        pr_info!("rustyring: 你好，内核（P2 版本）\n");
        try_pin_init!(Self {})
    }
}
```

逐行读这个最小的"内核程序"：

- **`module!` 宏**声明模块元信息——`type` 指向承载初始化逻辑的类型，`name`/`license` 等进入模块的 modinfo（`modinfo rustyring.ko` 可查）。注意它仍是声明式宏而非 `#[module]` 属性（网上新旧说法都有，以 samples 为准）。
- **`InPlaceModule` trait**是模块的入口协议：`init` 返回的是 `impl PinInit<Self, Error>`——不是 `Self`！这是[第 5 章](/principles/pinning-init)的直接后果：模块结构体可能含不可移动字段，因此由模块系统分配内存、就地执行初始化器。
- **`try_pin_init!(Self {})`**为零字段结构体生成一个"什么都不做"的初始化器；P3 起这里会出现真正的字段与 `<-` 就地初始化语法。
- `pr_info!` 来自 prelude——内核日志的 info 级，`dmesg` 里见。

## 接线：Kconfig 与 Makefile

内核是配置驱动的，新文件必须让 Kbuild 认识。编辑 `samples/rust/Kconfig`，在现有 sample 配置项旁边加：

```ini
config SAMPLE_RUSTYRING
    tristate "Rusty ring buffer sample"
    depends on RUST
    help
      我们的实战成果物：环形缓冲 misc 字符设备（连载随教程生长）。
```

再编辑 `samples/rust/Makefile`：

```make
obj-$(CONFIG_SAMPLE_RUSTYRING) += rustyring.o
```

两行接线，内核构建系统由此知道：`CONFIG_SAMPLE_RUSTYRING=m` 时把 `rustyring.rs` 编成模块。`.o` 后缀配 `.rs` 源文件——Kbuild 按 `RUST` 配置自动分派给 rustc，这正是[第 9 章](/principles/build-system)讲过的机制。

## 构建与加载

```bash
# 1. 启用我们的 sample（Kernel hacking → Sample kernel code → Rust samples）
make LLVM=1 menuconfig

# 2. 构建（增量，很快）
make LLVM=1 -j$(nproc)

# 3. 产物在哪
ls samples/rust/rustyring.ko
```

进入测试虚机（快速上手的 virtme-ng），验证生命周期：

```console
# insmod /lib/modules/$(uname -r)/kernel/samples/rust/rustyring.ko
# dmesg | tail -1
rustyring: 你好，内核（P2 版本）
# rmmod rustyring
# dmesg | tail -1
rustyring: 你好，内核（P2 版本）   ← 没有新的告别日志
```

::: tip 为什么没有退出日志？
零字段模块没有实现 `PinnedDrop`，`rmmod` 时模块结构体直接销毁、无钩子可打日志。P3 给结构体加上字段和 `#[pinned_drop]` 后，对称的退出信息自然就有了。
:::

## 排障速查

| 症状 | 方向 |
| --- | --- |
| menuconfig 里找不到我们的选项 | 确认 `CONFIG_RUST=y` 已启用（前置门槛）且 Kconfig 片段缩进用 **Tab**（Kconfig 对空白敏感） |
| 构建报 `rustyring.rs` 相关错误 | `make LLVM=1 rustavailable` 复查工具链；对照本节代码逐行 diff |
| `insmod` 报 `Invalid module format` | 虚机内核与构建树不一致——用同一棵树构建并启动（virtme-ng 在树内运行天然一致） |
| `insmod` 报 `No such file or directory` | `.ko` 路径不对；或模块依赖的 Rust 支持未启用 |

## 当前完整代码

::: details samples/rust/rustyring.rs（P2 版）
```rust
// SPDX-License-Identifier: GPL-2.0

//! rustyring：环形缓冲字符设备（实战篇成果物，随连载生长）。

use kernel::prelude::*;

module! {
    type: Rustyring,
    name: "rustyring",
    authors: ["Rust for Linux 学习者"],
    description: "环形缓冲 misc 字符设备",
    license: "GPL",
}

struct Rustyring;

impl kernel::InPlaceModule for Rustyring {
    fn init(_module: &'static ThisModule) -> impl PinInit<Self, Error> {
        pr_info!("rustyring: 你好，内核（P2 版本）\n");
        try_pin_init!(Self {})
    }
}
```
:::

下一章让它成为真正的设备：注册 misc 字符设备、实现 open 与读写。[P3：misc 字符设备](/practice/misc-device)
