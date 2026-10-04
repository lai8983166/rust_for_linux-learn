---
title: 中英术语表
---

# 中英术语表

内核 Rust 处在中英混说的地带：邮件列表用英文、中文社区译法未统一。本表收录正文出现过的术语，给出**本教程采用的译法**与一句解释。正文首次出现处的译法与此表一致。

## 核心概念

| 英文 | 本教程译法 | 解释 |
| --- | --- | --- |
| safety abstraction | 安全抽象 | 用健全的安全 API 包装 unsafe 内部，让上层写不出内存安全 bug 的分层手法（第 1 章） |
| soundness | 健全性 | "无论外部如何（滥用）安全 API 都不触发 UB"的性质，安全抽象的验收标准 |
| unsafe boundary | 安全边界 | unsafe 标记出的契约线：调用者必须维护的前提 |
| SAFETY comment | SAFETY 注释 | 每处 unsafe 操作必须附带的"为何满足前提"说明，评审逐条检查 |
| pinning | 钉住 | 禁止对象移动的保证；内核对象因自引用/外部登记而 `!Unpin`（第 5 章） |
| in-place initialization | 就地初始化 | 先定最终地址再构造的初始化模型，pin-init 框架的语言化 |
| field projection | 字段投影 | 对 `Pin<&T>` 安全地取得 `Pin<&Field>` 的语言能力，正在补齐中 |
| newtype | 新类型 | 单字段包装结构（如 `Flags(u32)`、`Error(NonZeroI32)`），把不变量编码进类型 |
| RAII | （不译） | 资源获取即初始化：构造获取、`Drop` 释放，内核 Rust 资源管理的主旋律 |
| guard | 守卫 | 证明某资源已被持有的对象，生命周期即持有期（锁 guard 是典型，第 7 章） |
| capability token | 能力令牌 | 以出示对象证明前提成立的模式（`LocalInterruptDisabled`） |
| type-state | 类型状态 | 用类型系统区分对象所处阶段（未初始化/已初始化）的手法 |

## 内核惯用语

| 英文 | 本教程译法 | 解释 |
| --- | --- | --- |
| bindings | 绑定层 | bindgen 从 C 头生成的 FFI 声明 crate，全 unsafe，驱动禁直连 |
| backend | 后端 | `Lock<T, B>` 的 B：一种具体锁的实现（`SpinLockBackend` 等） |
| lock class | 锁类目 | lockdep 死锁检测的分类单位，`static_lock_class!()` 生成 |
| bound（`Data<'bound>`） | 绑定 | 驱动数据生命周期绑定到设备引用存活期的类型参数（第 8 章） |
| GFP flags | GFP 标志 | 分配请求的上下文说明（能否阻塞、是否记账），`Flags(u32)` 承载 |
| vmalloc | （不译） | 虚拟地址连续的分配器，对应 `VVec`/`VBox` |
| devm | （不译） | C 侧设备托管资源机制；Rust 侧被 RAII 泛化 |
| probe / unbind | （不译） | 驱动绑定/解绑设备的核心回调，probe 返回初始化器 |
| drvdata | （不译） | 驱动核心挂在设备上的私有数据指针，Rust 侧被 `Data<'bound>` 类型化 |
| opaque type | 不透明类型 | `Opaque<T>`：承载 C 侧数据的 FFI 内存（未初始化、可被 C 并发改、不可移动） |
| refcount | 引用计数 | 对象生命周期计数；`AlwaysRefCounted` trait + `ARef` 包装 |
| allowlist | 白名单 | 构建期符号/特性准入清单（bindgen allowlist、`-Zallow-features`） |
| lockdep | （不译） | 内核锁依赖检测器，Rust 锁经 `assert_is_held` 接入 |

## 社区与流程

| 英文 | 本教程译法 | 解释 |
| --- | --- | --- |
| abstraction layer | 抽象层 | `kernel` crate 及各子系统安全抽象的统称 |
| maintainer | 维护者 | 子系统/层的签字责任人；Rust 抽象需相关子系统维护者认可 |
| upstream | 上游 | 主线内核（torvalds 树）；"提上游" = 把改动推进主线 |
| tracking issue | 跟踪议题 | unstable 特性在 Rust 上游的设计/推进记录，内核依赖特性逐个有对应 |
| RFC | （不译） | 征求意见稿，大改动的标准起点（2020 年 Rust 内核 RFC） |
| LPC | （不译） | Linux Plumbers Conference，内核开发者年会，Rust 议题的传统场地 |
| sound / unsound | 健全 / 不健全 | 实现是否真正满足安全承诺的定性（不健全 = 存在 UB 通路） |
