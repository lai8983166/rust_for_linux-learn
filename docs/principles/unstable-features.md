---
title: 为什么用 unstable 特性
---

# 为什么用 unstable 特性

一个反直觉的事实：内核这门对稳定性要求最苛刻的软件，却建立在 Rust 的 unstable 特性之上。发行版打包者为此头疼，纯 Rust 应用开发者觉得离经叛道，而内核社区认为别无选择。这一章拆解这个矛盾：内核到底用了哪些 unstable 特性、怎么管住它们、以及为什么不能等 stable。

<VersionBadge label="本文锚定" kernel="master 树" rustc="1.85 (bindgen 目标)" date="2026-10" />

> 事实来源：[`rust/kernel/lib.rs`](https://github.com/torvalds/linux/blob/master/rust/kernel/lib.rs)的 feature 声明、顶层 [`Makefile`](https://github.com/torvalds/linux/blob/master/Makefile)与 [`rust/Makefile`](https://github.com/torvalds/linux/blob/master/rust/Makefile)（2026-10 检索）。

## 内核怎么用 unstable

先看机制的三层现实（与很多旧文章的描述已经不同）：

**第一层：crate 级 `#![feature(...)]` 声明清单。** `rust/kernel/lib.rs` 顶部今天挂着这些：

```rust
// 已稳定的（注释里留着纪念）：
//#![feature(unsigned_is_multiple_of)]  // stable since Rust 1.87.0
//#![feature(generic_arg_infer)]        // stable since Rust 1.89.0
#![feature(arbitrary_self_types)]
#![feature(derive_coerce_pointee)]
#![feature(used_with_arg)]
#![cfg_attr(CONFIG_RUSTC_HAS_FILE_WITH_NUL, feature(file_with_nul))]
```

清单本身就是治理界面：每加一个特性都要在邮件列表过审，说明用途与替代方案；特性一旦在上游 stable，就从清单删除（上面两条注释就是刚"毕业"的例子）。

**第二层：宿主构建的零容忍白名单。** 顶层 Makefile 里：

```make
KBUILD_HOSTRUSTFLAGS := $(rust_common_flags) -O -Cstrip=debuginfo \
			-Zallow-features=
```

空列表——宿主工具（构建期间运行的程序）**一个 unstable 特性都不许用**。能碰 unstable 的只有进内核镜像的代码。

**第三层：`RUSTC_BOOTSTRAP=1`。** 顶层 Makefile 导出这个变量，允许 stable 编译器接受 `#![feature]`——内核发行版（如 Ubuntu 打包内核）可以用发行版仓库里的 stable rustc 构建内核，而不必等它变成 nightly。这是"用 stable 编译器跑 unstable 特性"的官方豁免口，发行版链路的救命稻草。

顺带一提版本锚点：`rust/Makefile` 里 bindgen 以 `--rust-target 1.85` 生成绑定（最低支持版本的锚），而同文件注释提到"Rust 1.95 起 custom target spec 需要 `-Zunstable-options`"——master 树实际要求相当新的编译器。Kconfig 还能对编译器能力做细粒度探测，例如 `CONFIG_RUSTC_HAS_FILE_WITH_NUL` 就是专门探测 `file_with_nul` 特性可用与否的开关，反过来控制 `cfg_attr` 是否启用该 feature——**特性可用性本身成了内核配置项**。

## 白名单里都有什么

逐个看现存特性的动机（这正是"缺什么语言能力"的清单）：

- **`arbitrary_self_types`**——允许 `self: Pin<&Self>`、`self: &ARef<Self>` 这类自定义接收者类型。第五章的 pinning、第二章的 `ARef` 智能指针方法都靠它；没有它，这些类型只能退回裸 `&self` 并丢失所有权语义。**字段投影**（对 `Pin<&T>` 安全取 `Pin<&Field>`）的推进也与此家族相关，`rust/kernel/ptr/projection` 是内核侧的前瞻实现。
- **`derive_coerce_pointee`**——支持对含生命周期参数的智能指针正确 derive `CoercePointee`（协变弱类型自动转换）。`ARef`、`Arc` 一族指针的类型人体工学依赖它。
- **`used_with_arg`**——让 `#[used]` 等链接器保留段能指定归属模块，模块加载/卸载的元数据段需要。
- **`file_with_nul`**——`file!()` 宏返回以 NUL 结尾字符串，方便直接喂给 C 接口（省去运行期转换）。

共同点清晰可见：**全是"与 C 共处"和"自定义智能指针"两大方向的语言缺口**——恰好是 std 程序员永远碰不到、内核天天要用的区域。

## 为什么不能等 stable

三个理由，按分量排序：

1. **等不起**。Rust 特性从提出到 stable 平均以年计；而内核的抽象层开发是现在进行时。如果只准用 stable，`ARef`/pin-init/字段投影全都做不了，安全抽象的能力上限会被钉死在数年前的语言水平——第一章的整个分层哲学就失去了技术支撑。
2. **内核反向推动语言演进**。`arbitrary_self_types` 等特性的 tracking issues 里，内核是头号用户与需求方。这是共生关系：内核当高级试验场，语言团队获得真实反馈。Rust 项目甚至为此调整过特性推进的优先级。
3. **治理成本可承受**。因为清单短、每个都有 tracking issue、每个都有评审记录。用 unstable ≠ 滥用 unstable——第二层那个空 `allow-features` 就是给"不许滥用"画的线。

## 发行版与下游的现实

矛盾落在打包者身上：内核要求"相当新的 rustc"，发行版仓库的 rustc 有自己的更新节奏。现实解法分层：

- **Ubuntu 24.04**：并行安装版本化包（`rustc-1.85`、`rust-1.85-src`、`bindgen-0.71`），构建时显式传 `RUSTC=`/`BINDGEN=` 变量（快速上手章的速查表即此）。
- **Ubuntu 26.04+ / 滚动发行版**：仓库 rustc 足够新，只需 `RUST_LIB_SRC` 指向库源码。
- **kernel.org 预编译工具链**：官方提供 LLVM+Rust 配套包，绕过发行版节奏。
- **`RUSTC_BOOTSTRAP=1`**（前述）：让 stable rustc 临时解锁，缓解"差一个小版本"的尴尬。

对教程读者的实际建议：**跟着 master 走就用最新 stable rustc + rustup（`rust-src` 组件别忘）；跟某个 LTS 内核版本走，就用该版本 `Documentation/rust/quick-start.rst` 标注的最低版本**。这也是全教程反复版本锚定的又一个理由——unstable 特性清单在不同内核版本间差异极大，旧文章的"内核用了这些特性"很可能已经删了一半、换了几个。

## 小结

- 现行机制三层：crate 级 `#![feature]` 清单（治理界面）、宿主空 `allow-features`（零容忍线）、`RUSTC_BOOTSTRAP=1`（stable 编译器豁免）
- 现存特性集中在"与 C 共处"与"自定义智能指针"两大语言缺口，逐个有 tracking issue 与评审记录
- 不能等 stable：抽象层能力上限、与语言团队的共生关系、可控的治理成本
- 发行版用版本化包、官方工具链与 BOOTSTRAP 豁免消化矛盾

语言层的设计讲完了。下面回到工程层，看最日常也最见功力的一类抽象：锁。[下一章：同步原语的 RAII 封装](/principles/synchronization)。
