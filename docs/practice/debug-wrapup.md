---
title: P6：调试与收尾
---

# P6：调试与收尾

功能在 P5 就齐了；这章收拾战场：一套日志等级策略（什么时候 `pr_info`、什么时候 `pr_debug`）、一张综合排障表、内核 Rust 代码的测试出路，最后盘点成果物的边界与生长方向。

<VersionBadge label="本文锚定" kernel="master 树" date="2026-10" />

## 日志等级策略

`pr_*` 家族的等级不是装饰，是**运维成本**决策：

| 宏 | 用途 | rustyring 中的正确用法 |
| --- | --- | --- |
| `pr_err!` / `dev_err!` | 设备仍能工作，但功能受损 | 未知 ioctl 命令（已用） |
| `pr_warn!` | 异常但可自愈 | 短写发生且调用方可能不知情（可选） |
| `pr_info!` | 一次性的生命周期事件 | 模块注册（已用） |
| `pr_debug!` / `dev_dbg!` | 高频路径的细节 | 每次 open/read/write 的字节计数 |
| `pr_devel!` | 仅开发期 | 调试环形算术时临时加 |

两条实战原则：

1. **热路径用 `dev_dbg!`**。`read_iter`/`write_iter` 每秒可能被调上千次，往里面放 `pr_info!` 会淹没日志还拖慢 I/O。`*_dbg` 默认不输出，需要时经 dynamic debug 按文件/行打开：`echo 'file rustyring.rs +p' > /sys/kernel/debug/dynamic_debug/control`。
2. **设备侧优先 `dev_*` 而非 `pr_*`**。带 `ARef<Device>` 的日志自带设备名与位置，多设备实例时能区分——我们在 P3 特意保存 `dev` 字段，就是为了这里。

给 rustyring 补上读写字节计数（可选作业）：

```rust
dev_dbg!(self.dev, "read {} bytes, {} remain\n", total, guard.len);
```

## 综合排障表

实战篇所有排障要点的合并版，按"现象 → 第一步查什么"组织：

| 现象 | 第一步 |
| --- | --- |
| 构建期：menuconfig 找不到模块选项 | `CONFIG_RUST` 前置；Kconfig 缩进用 Tab |
| 构建期：rustc 报特性/版本错误 | `make LLVM=1 rustavailable`；rustc 过旧（[第 6 章](/principles/unstable-features)的版本锚定） |
| 加载期：`Invalid module format` | 虚机内核 ≠ 构建树；virtme-ng 在树内启动 |
| 加载期：`Unknown symbol` | 模块依赖的 Rust 支持未启用；`dmesg` 看缺哪个符号 |
| 运行期：`/dev/rustyring` 不出现 | `/proc/misc` 找名字；devtmpfs 挂载 |
| 运行期：读写行为怪 | 同一 fd？短写语义理解对了吗（[P4](/practice/state-and-sync)） |
| 运行期：ioctl `ENOTTY` | 两侧命令编码公式逐字段对（[P5](/practice/ioctl-uaccess)） |
| 崩溃：oops/panic | `dmesg` 里栈回溯找 `rustyring` 帧；配合下一节的 KUnit 与源码行号 |

oops 处理的通用流程与 C 模块无异：读栈、定位源文件行号（v0 symbol mangling 保证了可读性，[第 9 章](/principles/build-system)）、最小化重现。区别在于 Rust 侧能炸的面更小——你写的那 150 行里没有裸指针解引用。

## 测试出路：KUnit 与 doctest

内核 Rust 代码有三层测试设施（`Documentation/rust/testing` 有完整说明）：

- **`rusttest` 目标**：`make LLVM=1 rusttest` 把 `kernel` crate 的文档测试（doctest）在主机上编译运行——不进内核，跑得飞快；`CONFIG_RUST_KERNEL_DOCTESTS` 可让它们以 KUnit 形式进内核跑
- **KUnit**：`kunit` 模块提供 `#[kunit_tests]` 宏（prelude 里就有），可以给 `Inner` 的环形算术写宿主端单元测试——`push_from`/`pop` 的回绕边界（`head` 在 `CAP-1` 处跨界）正是单元测试的完美靶子
- **QEMU 冒烟**：我们 P2-P5 用的"加载 + 用户态程序验证"本质是冒烟测试，脚本化后可进 CI

值得做的作业：给 `Inner` 加 `#[kunit_tests]`，覆盖"写满短写""跨界两段拷贝""RESET 后 head 归零"三个用例——环形缓冲的边界条件，正是手工测试最容易漏的。

## 成果物盘点

六章下来，`rustyring.rs` 约 150 行，包含：

- misc 设备注册与自动反注册（`PinnedDrop`）
- 每次 open 的钉住状态（`Pin<KBox<Self>>`，`ForeignOwnable` 挂 private_data）
- `Mutex` 保护的定容环形队列（两段拷贝、短写、EOF）
- ioctl 控制面（`_IOR`/`_IO` 编码、`UserSlice` 带检查拷贝）
- 与用户态 C 程序的完整 UAPI 互操作

回头看导览章的承诺——"每章代码是下一章的起点"——以及它踩过的原理篇概念：`module!` 与 `InPlaceModule`（P2）、`PinInit` 三连（P3）、GFP 与 `KVec`（P4）、`Mutex` guard 与 `Unpin`（P4）、errno 与 `EFAULT`（P5）、设备引用计数 `ARef`（P3/P5）。**实战篇是原理篇的习题解答，原理篇是实战篇的答案册。**

## 生长方向

rustyring 刻意保持小巧，这些是自然的下一步（难度递增）：

1. **跨 open 共享队列**：把 `Inner` 从 per-open 挪到模块级全局——需要 static 钉住初始化（`pin-init` 对 static 的支持），两个进程就能通过设备对话
2. **阻塞 I/O**：队列空时 `read` 挂起等待而非返回 0——`CondVar`/等待队列的领地，正是[第 7 章](/principles/synchronization) CondVar 的用武之地
3. **platform 驱动形态**：挂到设备树上、走 probe/unbind 生命周期——把[第 8 章](/principles/device-model)的 `Driver` trait 接上真实外设（GPIO、温度传感器）
4. **合入上游**：以 `samples/rust/` 新示例或驱动形式向 rust-for-linux 邮件列表投稿——[展望章](/outlook/future)的协作协议是行动指南

## 收官

```console
# lsmod | grep rustyring
rustyring               16384  0
# dmesg | grep rustyring | tail -4
rustyring: 注册 misc 设备
rustyring: 打开设备（队列容量 4096）
rustyring: 设备状态销毁
```

从 `insmod` 打招呼到 150 行完整设备——你已经把[导览](/practice/overview)承诺的东西握在手里了。接下来：回到[原理篇](/principles/safety-philosophy)查漏补缺，去[展望章](/outlook/future)挑个方向深潜，或者翻着[附录速查表](/appendix/c-rust-mapping)开始写你自己的驱动。
