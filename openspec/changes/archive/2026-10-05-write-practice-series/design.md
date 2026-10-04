## Context

原理篇已建立概念体系；实战篇是"从零写一个字符设备驱动"的连载。既有 spec：`tutorial-site`（导航结构）、`principles-content`（章节质量契约，本 change 不动它但实践上沿用其精神）。见 proposal 与 specs delta。

## Goals / Non-Goals

**Goals:**

- 六章连载，终产物 = 具备 open/read/write/ioctl 的 misc 字符设备驱动（"rustyring"环形缓冲设备）
- 代码事实全部对照 master 树核实，优先与 `samples/rust/` 交叉印证
- 每步给验证命令与预期输出（dmesg、ls /dev、cat/echo 等）
- 与原理篇互链：每处用到概念给回链

**Non-Goals:**

- out-of-tree 模块构建（走内核树内 samples 路径——这是官方支持最顺的路；out-of-tree 另立专题）
- platform 驱动/设备树实战（原理篇第 8 章已覆盖其形态，实战篇聚焦字符设备）
- 阻塞 I/O、等待队列、mmap（收尾章指路）

## Decisions

**D1：成果物选型 = misc 字符设备 + 环形缓冲**
miscdevice 是官方 samples 覆盖最全的字符设备入口（免主设备号管理），环形缓冲天然需要锁与容器——正好把原理篇第 4/7 章用上。命名 `rustyrfg`? 定名 **rustyring**。

**D2：构建路径 = 内核树内（samples 位置）**
把实战代码放进内核树 `samples/rust/`（或自建 `drivers/misc/` 子目录 + Kconfig），沿用 `make LLVM=1 M=...`? —— 树内子目录直接整体构建。这避免 out-of-tree Rust 支持的额外复杂度，且与快速上手章的环境无缝衔接。**以核实的 samples 构建方式为准写**（Kconfig/Makefile 形态从 samples 现状抄）。

**D3：module 宏形态以 samples 为准**
prelude 显示 `module` 来自 `macros` crate（proc-macro），提示可能是 `#[module]` 属性宏而非旧的 `module! {}`。**不预设，以 `samples/rust/rust_miscdevice.rs` 的实际写法为准**，正文照实写并注明这是近年变更点。

**D4：每章尾部"当前完整代码"折叠块**
连载最容易跟丢。每章末给当前版本的完整代码（details 折叠容器），下一章从这里出发——同时满足 spec 的"章间衔接"场景。

**D5：六章切分**
导览（0 代码）→ 第一个模块（加载/卸载）→ misc 注册 + open/read/write 回环 → SpinLock/KVec 环形缓冲 → ioctl + UserSlice → 调试收尾。每章提交一次。

## Risks / Trade-offs

- [miscdevice API 近年多变（Builder/Options 形态）] → 全部以 master 的 miscdevice.rs 与 rust_miscdevice 示例双源核实后才写
- [树内构建对读者机器要求高（须先编译带 Rust 的内核）] → 导览章明确前置条件并回链快速上手；这是既定门槛不是缺陷
- [Windows 读者无法本地跟做] → 沿用快速上手的 WSL2 方案，导览章重申

## Migration Plan

纯新增（6 新页 + config 一处修改）。回滚 = revert config 提交 + 删除 practice 目录。
