---
title: 展望与学习路线
---

# 展望与学习路线

原理篇讲完了"现在"。这一章聊聊"接下来"：抽象层还在往哪长、老驱动怎么办、以及你作为学习者下一步往哪走。

## 抽象层的覆盖范围还在生长

回看第二章那张模块表：约 70 个模块里，一半以上带 `#[cfg(...)]` 门控，且每个内核版本都在增加——`RUST_*_ABSTRACTIONS` 这类 CONFIG 选项的名字本身就是路线图：PWM、serial-dev、fw-loader 的抽象都是近年才陆续合入的。趋势清晰：

- **由外围向核心推进**：从字符设备、miscdevice 这些低风险入口，逐步走向 GPU（Nova/AGX/Mali）、网络（MAC 驱动已合入）、块设备、文件系统（EROFS 已有 Rust 实现）
- **抽象先行、驱动跟随**：每个新子系统都是先合入安全抽象层（经该子系统维护者评审），Rust 驱动才有落点
- **_android_ 与厂商是最大推手**：Binder 的 Rust 化证明了"数百万设备在跑"不是口号

判断"现在能不能用 Rust 写某类驱动"的方法就藏在第二章：看 `rust/kernel/` 里有没有对应模块、它的 CONFIG 门控是否已从 `RUST_*_ABSTRACTIONS`（实验）转成跟随子系统本身的开关。

## 驱动迁移策略

社区共识（也是 Linus 反复表态的）是**只对新代码开放**：不重写现有 C 驱动，不给维护者加活。落到决策：

- 新驱动、尤其内存安全敏感的（解析不可信输入：网络包、文件系统镜像、固件）→ Rust 是明显赢家
- 修补现有 C 驱动 → 留在 C；混语言的维护成本超过收益
- 子系统无抽象层 → 要么等、要么自己给抽象层提 patch（这是贡献上游的高价值入口）

## 与 C 维护者协作

引子里的"文化战争"没有终局，但有工作协议：抽象层代码在 `rust/` 树内由 Rust-for-Linux 团队维护，但**触及某子系统的安全抽象需该子系统维护者签字**——2024 年的风暴正是围绕这个签字义务的边界。给学习者的现实建议：

1. 读 `Documentation/process/submitting-patches` 之外，加读 `Documentation/rust/` 全目录
2. 第一份 patch 从抽象层的文档改进或 `samples/rust/` 入手，别上来就动大件
3. 邮件列表（rust-for-linux@) 的氛围对新手友好，问题问在点子上会有详细回复

## 源码阅读路线图

教程之外，把源码树当下一本教材：

1. `rust/kernel/error.rs` → `types.rs`（第一遍快速过，工具箱）
2. `samples/rust/` 全家（每个都不到百行，`make LLVM=1 rustdoc` 可生成文档）
3. `rust/kernel/sync/`（lock/arc/aref 三件套精读）
4. `rust/kernel/device.rs` + `driver.rs` + `platform.rs`（第八章的完整版）
5. 一个真实驱动对照读：`drivers/gpu/drm/nova/`（NVIDIA，体系完整）或 `drivers/android/binder/` 的 Rust 部分（部署量最大）
6. `rust/Makefile` 与 `bindings_helper.h`（第九章的实物）

工具：[elixir.bootlin.com](https://elixir.bootlin.com/linux/latest/source/rust)跳转检索最顺手；想跑实验就回[快速上手](/quick-start/environment)的 QEMU 环境。

## 给这个教程的后续

本教程定位"原理深挖"，刻意留白的部分：实战篇（写一个完整的字符设备/platform 驱动从零到合入标准）、调试篇（pr_* 等级策略、panic 处理、KUnit、ftrace 与 Rust 的配合）、专题篇（GPU/网络/文件系统驱动各一章）。教程本身在 git 仓库中持续修订——版本锚定徽章过时的章节会更新，欢迎以 issue/邮件的形式指出正文与最新 master 树的出入。

## 小结

- 抽象层按子系统渐进合入，`RUST_*_ABSTRACTIONS` 的去留是成熟度信号
- 新代码用 Rust、旧代码留 C、缺口提抽象层 patch
- 与 C 维护者的签字协议是协作的现实边界
- 阅读路线：error → samples → sync → device/driver → 真实驱动 → 构建系统

去[附录](/appendix/c-rust-mapping)领你的速查表，然后打开 `rust/` 目录——那里才是真正的教材。
