---
title: 内存分配：KBox/KVec 与 GFP
---

# 内存分配：KBox/KVec 与 GFP

标准库的 `Box`/`Vec` 有一套深入骨髓的假设：分配**不会失败**、全局有唯一的分配器、调用者无需说明"这次分配的上下文"。内核世界里这三条假设一条都不成立。这一章看 `kernel` crate 的分配 API 如何把这三条假设全部显式化——它们是理解"内核 Rust 不是带内核后缀的 std"的第一课。

<VersionBadge label="本文锚定" kernel="master 树" date="2026-10" />

> API 事实对照 [torvalds/linux master 的 `rust/kernel/alloc.rs` 与 `rust/kernel/alloc/kvec.rs`](https://github.com/torvalds/linux/tree/master/rust/kernel/alloc)核实（2026-10 检索）。

## 为什么没有全局分配器

std 的 `Box::new(v)` 之所以能直接返回 `Box<T>` 而不是 `Result`，是因为 Rust 全局分配器契约允许它直接 `abort`——分配失败即程序终止。这对应用合理，对内核是灾难：内核里分配失败是**常态**（内存紧张时 `kmalloc` 返回 NULL 天经地义），驱动的 probe 被拒绝、缓存降级、请求排队，都是正常的错误处理路径。

于是内核 Rust 的分配 API 做了两个根本改变：

1. **分配器成为类型参数**。`rust/kernel/alloc/kvec.rs` 中 `Vec` 的真实形态是：

   ```rust
   pub struct Vec<T, A: Allocator> {
       ptr: NonNull<T>,
       layout: ArrayLayout<T>,
       len: usize,
       _p: PhantomData<A>,
   }
   ```

   内核常用的三组分配器通过类型别名固定下来：

   ```rust
   pub type KVec<T> = Vec<T, Kmalloc>;    // 物理连续内存（kmalloc 家族）
   pub type VVec<T> = Vec<T, Vmalloc>;    // 虚拟连续即可（vmalloc）
   pub type KVVec<T> = Vec<T, KVmalloc>;  // 先 kmalloc、失败降级 vmalloc
   ```

   选哪个分配器是内存布局决策（DMA 需要 `KVec`，大缓冲用 `VVec` 省物理内存），写进类型后无法在运行时悄悄替换——和第一章"不变量进类型"一脉相承。`KBox`/`VBox`/`KVBox` 同理。

2. **可失败性写进返回类型**。所有可能分配的构造函数都返回 `Result`。

## Flags：分配语义的参数化

第三个假设——"调用者无需说明上下文"——由 `Flags` 类型修正。`rust/kernel/alloc.rs`：

```rust
pub struct Flags(u32);   // 新类型包装 gfp_t

pub mod flags {
    pub const GFP_KERNEL: Flags = Flags(bindings::GFP_KERNEL);
    pub const GFP_ATOMIC: Flags = Flags(bindings::GFP_ATOMIC);
    pub const GFP_KERNEL_ACCOUNT: Flags = ...;
    pub const GFP_NOWAIT: Flags = ...;
    pub const __GFP_ZERO: Flags = ...;      // 分配后清零
    pub const __GFP_NOWARN: Flags = ...;
}
```

GFP（Get Free Pages）标志回答的问题是：**这次分配发生在什么上下文、允许内核做什么来满足它**——能否阻塞回收内存（进程上下文的 `GFP_KERNEL` 可以，原子上下文的 `GFP_ATOMIC` 绝不可以）、要不要记账到 memcg、失败要不要告警。传错标志在 C 里是经典 bug：在中断处理路径传 `GFP_KERNEL` 会导致睡眠而死锁。

`Flags` 实现了 `BitOr`，组合语义自然表达：

```rust
let flags = GFP_KERNEL | __GFP_ZERO;   // 内核上下文分配 + 清零
```

注意这里有个跨章细节：`GFP_KERNEL` 在 C 里是宏，bindgen 看不见宏——`bindings_helper.h` 里专门有一批 `RUST_CONST_HELPER_GFP_*` 把宏包装成 bindgen 能消化的常量（第九章展开）。**为什么是函数参数而不是环境状态**：分配语义必须随调用点走，同一函数在不同路径可能需要不同标志，把它做成参数才能在类型和调用处显式可见、评审可见。

## 分配 API 实战

以 `KVec` 为例（均为真实签名）：

```rust
// 不分配的空 Vec——注意这是 const fn
let mut v: KVec<u8> = KVec::new();

// 预分配容量，需要 flags，可能失败
let mut v: KVec<u8> = KVec::with_capacity(64, GFP_KERNEL)?;

// T: Zeroable 时可要求清零分配
let z: KVec<u64> = KVec::zeroed(8, GFP_KERNEL)?;

// push 也带 flags——因为可能触发扩容再分配
v.push(elem, GFP_KERNEL)?;

// 不允许扩容的变体：容量不足时把元素原样还给你（PushError<T>）
v.push_within_capacity(elem)?;
```

三个设计点值得咀嚼：

- `push(&mut self, v: T, flags: Flags)` ——std 的 `push` 不可能失败，内核的必须能失败，于是 flags 必须跟着走。**每个可能分配的方法都带 flags**，这是"上下文参数化"贯穿到底的结果。
- `push_within_capacity` 提供了一条"绝不再分配"的逃生通道，失败时元素以 `PushError<T>` 完璧归赵——不是丢给你一个错误码，而是把值还给你，让调用者决定去处。这种"错误携带原始数据"的风格在内核 Rust 里反复出现。
- ZST（零大小类型）不分配、指针为 dangling——与 std 语义对齐，省掉热路径分支。

错误侧的衔接在第三章已经铺好：`with_capacity` 的错误类型是 `AllocError`，`?` 会经 `impl From<AllocError> for Error`（→ `ENOMEM`）自动收敛为 `Error`，传播链无需手写转换。

## Drop 与释放路径

C 里每次 `kmalloc` 都要配对一个 `kfree`，释放路径错了就是泄漏或 double-free。Rust 侧 `KVec`/`KBox` 走 RAII：离开作用域由 `Drop` 调用分配器的 `free`（经 `Allocator` trait 的统一入口），goto 清理链在分配这一类资源上彻底消失（第三章的双版对照已展示过）。

两个补充细节：

- **`Allocator` 是抽象层**：`pub unsafe trait Allocator` 以 `realloc` 为必须方法、`alloc`/`free` 为提供默认实现的辅助方法。`Kmalloc`/`Vmalloc`/`KVmalloc` 是它的三个内置实现，页分配器级的 `mm`/`page` 模块在更底层（超出本章范围）。这意味着未来引入新的分配域（比如特定设备内存）只需新增一个 `Allocator` 实现，`Vec`/`Box` 全家免费获得支持。
- **逃生舱仍在**：`from_raw_parts(ptr, len, capacity)` / `into_raw_parts(self)` 允许在 FFI 边界交接裸指针——与 C 子系统共享缓冲区时用，责任随之回到你手上（第一章的边界纪律）。

托管分配（devm 风格：设备移除时自动释放）是另一条释放路径，它属于设备生命周期的故事，留到第八章。

## 小结

- 内核分配三假设全破：分配器是类型参数（`KVec`/`VVec`/`KVVec`）、失败是常态（全 `Result`）、上下文是参数（`Flags`）
- `Flags(u32)` 把 GFP 语义显式化，原子上下文传错标志这类 C 经典 bug 获得了调用点可见性
- `push_within_capacity`/`PushError<T>` 展示了"错误携带数据"的内核风格
- RAII 释放消灭 kmalloc/kfree 配对；`Allocator` trait 为新分配域留好扩展点

内存解决了"存在哪里"的问题。下一章处理更根本的：这块内存上的对象**为什么不能动**——pinning 与就地初始化，内核 Rust 公认最硬核的部分。

[下一章：Pinning 与就地初始化](/principles/pinning-init)
