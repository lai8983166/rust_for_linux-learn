---
title: 导览：我们要造什么
---

# 导览：我们要造什么

原理篇给了你地图，这一篇给你方向盘。实战篇是一个连载：六章之内，我们从空文件开始，亲手写出一个叫 **rustyring** 的字符设备驱动——一个环形缓冲设备，写入的数据排队存放、按序读出，并支持 ioctl 查询与清空。每章的代码都建立在前一章的产物上，跟完即拥有一个完整、可加载、可测试的内核模块。

<VersionBadge label="本文锚定" kernel="master 树" date="2026-10" />

> 实战篇的 API 形态对照 [torvalds/linux master](https://github.com/torvalds/linux)的 `samples/rust/rust_misc_device.rs`、`rust/kernel/miscdevice.rs`、`rust/kernel/uaccess.rs` 等核实（2026-10 检索），我们的成果物就是这个官方示例的"环形化改写"。

## 成果物：rustyring 是什么

一个 misc 字符设备（`/dev/rustyring`），行为约定：

- `write`：把用户数据**压入**环形缓冲（容量 4096 字节，满则本次短写）
- `read`：从缓冲**弹出**最早写入的数据（FIFO，空则返回 0）
- `ioctl`：`RUSTYRING_GET_LEN` 查询当前积压字节数；`RUSTYRING_RESET` 清空缓冲

为什么选它当教材：小型（终版约 150 行）、完整（覆盖 open/read/write/ioctl 全部文件操作）、且每个环节都踩在原理篇的概念上——misc 注册（第 8 章设备模型）、`Pin<KBox>` 私有数据（第 5 章）、`Mutex` 保护共享状态（第 7 章）、`KVVec` 存数据（第 4 章）、`UserSlice` 跨地址空间（第 3 章错误处理贯穿始终）。

## 前置条件

跟做需要[快速上手](/quick-start/environment)的全部产出：

- 编译过一次启用 `CONFIG_RUST` 的内核（`make LLVM=1 rustavailable` 通过）
- 能在 QEMU/virtme-ng 里 `insmod` 内核示例模块
- Windows 用户：WSL2 环境（快速上手章第 0 步）

实战篇**在内核树内开发**（把模块放进 `samples/rust/`）：这是官方支持最顺、与示例代码最近的路；out-of-tree 构建是另一个话题，收尾章指路。

## 路线图

```mermaid
flowchart LR
    P2["P2<br/>第一个模块<br/>加载/卸载 + 日志"]
    P3["P3<br/>misc 设备<br/>open + echo 读写"]
    P4["P4<br/>环形缓冲<br/>Mutex + KVVec"]
    P5["P5<br/>ioctl<br/>UserSlice"]
    P6["P6<br/>调试收尾<br/>完整交付"]

    P2 --> P3 --> P4 --> P5 --> P6
```

| 章 | 结束时你拥有 | 主要新概念 |
| --- | --- | --- |
| [P2 第一个模块](/practice/first-module) | 能 insmod/rmmod 的空模块 | `module!` 宏、`InPlaceModule`、Kconfig/Makefile 接线 |
| [P3 misc 字符设备](/practice/misc-device) | `/dev/rustyring`（echo 语义：写什么读什么） | `MiscDevice` trait、`Pin<KBox>` 私有数据、`read_iter`/`write_iter` |
| [P4 状态与并发](/practice/state-and-sync) | 真·环形缓冲（FIFO、容量限制） | `Mutex<Inner>` 模式、两段拷贝、短写语义 |
| [P5 ioctl 与用户内存](/practice/ioctl-uaccess) | ioctl 查询/清空 + 用户态测试程序 | `_IOR`/`_IO` 编码、`UserSlice` 读写器 |
| [P6 调试与收尾](/practice/debug-wrapup) | 完整交付 + 排障能力 | 日志等级策略、KUnit 指路、下一步路线 |

## 阅读方式

- **跟做**：每章末尾有"当前完整代码"折叠块，掉队了就从那里同步
- **只读**：直接读各章代码块与"验证"小节，把连载当地图看
- 每章的"验证"小节给出命令与预期输出——跟做时务必执行，眼见为实

准备好了就去 [P2：第一个模块](/practice/first-module)。
