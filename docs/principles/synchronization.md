---
title: 同步原语的 RAII 封装
---

# 同步原语的 RAII 封装

锁是内核里最常用、也最容易写错的基础设施。C 的锁 API 是纯纪律：加锁解锁手工配对、锁住什么靠注释、中断上下文靠脑子记。`kernel` crate 的同步模块把这三件事全部类型化——它也是前六章概念的一次中型合演：`Opaque`、pin-init、`!Unpin` 全部到场。

<VersionBadge label="本文锚定" kernel="master 树" date="2026-10" />

> API 事实对照 [`rust/kernel/sync/lock.rs`](https://github.com/torvalds/linux/blob/master/rust/kernel/sync/lock.rs)与 `sync/lock/spinlock.rs` 核实（2026-10 检索）。

## guard 即临界区

整个设计浓缩在一句话里：**`lock()` 返回的 guard 的生命周期，就是临界区的边界**。

```rust
pub fn lock(&self) -> Guard<'_, T, B>
```

`Guard`（守卫）的定义（真实代码，省略属性）：

```rust
pub struct Guard<'a, T: ?Sized, B: Backend> {
    pub(crate) lock: &'a Lock<T, B>,
    pub(crate) state: B::GuardState,
    _not_send: NotThreadSafe,     // 第一章见过的老朋友：!Send 标记
}

impl<T: ?Sized, B: Backend> core::ops::Deref for Guard<'_, T, B> {
    type Target = T;
    // deref 到被保护的数据
}

impl<T: ?Sized + Unpin, B: Backend> core::ops::DerefMut for Guard<'_, T, B> {}

impl<T: ?Sized, B: Backend> Drop for Guard<'_, T, B> {
    fn drop(&mut self) { /* B::unlock(...) */ }
}
```

逐条读它的设计语言：

- **`Deref`/`DerefMut` 指向受保护数据**——持有 guard 就能读写数据，不持有就不能碰。C 里"这段代码需要持锁访问"的注释约定，变成了作用域事实。数据本身住在 `Lock` 内部的 `UnsafeCell<T>` 里，唯一的合法访问通道就是 guard。
- **`Drop` 解锁**——忘记解锁不可能发生；提前返回、`?` 传播（第三章）全都沿栈自动解锁。
- **`_not_send: NotThreadSafe`**——guard 不能被送到别的线程去解锁。解锁必须在加锁的同一上下文，这条 C 世界的人肉规则被一个字段钉死。
- **`DerefMut` 要求 `T: Unpin`**——第五章承诺的回响在此兑现：如果受保护的数据不可移动，持锁期间也不给你能移动它的 `&mut`。
- **`#[must_use]`**——丢弃 guard 的返回值会告警，防的是 `lock.lock();` 这种"加完立刻丢、等于没加"的笔误。

## SpinLock / Mutex 与 Backend 抽象

`Lock<T, B>` 是唯一的锁类型，具体锁由 `Backend` 参数化（`sync/lock.rs`）：

```rust
#[pin_data]
pub struct Lock<T: ?Sized, B: Backend> {
    #[pin]
    state: Opaque<B::State>,      // C 锁对象（第四章的 Opaque，第五章的 #[pin]）
    #[pin]
    _pin: PhantomPinned,
    pub(crate) data: UnsafeCell<T>,
}
```

`Backend` trait 把"一种锁"抽象成四个动作（均为 unsafe，由各后端用 SAFETY 注释实现）：

```rust
pub unsafe trait Backend {
    type State;         // C 侧锁对象类型，如 bindings::spinlock_t
    type GuardState;    // 解锁凭据，如 ()，或持有中断标志的 token

    unsafe fn init(ptr: *mut Self::State, name: *const c_char,
                   key: *mut bindings::lock_class_key);
    unsafe fn lock(ptr: *mut Self::State) -> Self::GuardState;
    unsafe fn unlock(ptr: *mut Self::State, guard_state: &Self::GuardState);
    // 另有 try_lock / relock / assert_is_held
}
```

于是具体锁只是类型别名加一个 Backend 实现（`sync/lock/spinlock.rs`）：

```rust
pub type SpinLock<T> = Lock<T, SpinLockBackend>;

unsafe impl Backend for SpinLockBackend {
    type State = bindings::spinlock_t;   // 直接复用 C 的 spinlock_t！
    type GuardState = ();
    // init → __spin_lock_init，lock → spin_lock，unlock → spin_unlock
}
```

**注意 `State = bindings::spinlock_t`**：Rust 的 SpinLock 不是重新实现的锁，而是 C 锁的包装——同一把锁在 C/Rust 两侧可以互操作，lockdep、锁统计等基础设施免费共享。`assert_is_held` 是给 lockdep 的钩子；`init` 的 `name` 与 `key` 参数就是传给锁类目（lock class）体系的，让死锁检测器认识这把锁。

`Mutex`、条件变量 `CondVar`（配合 `wait` 使用）同住 `sync` 模块，同一套模式，不再展开。

### 构造：pin-init 的日常亮相

第五章的 `Lock::new` 签名在此完全落地：

```rust
impl<T, B: Backend> Lock<T, B> {
    pub fn new(t: impl PinInit<T>, name: &'static CStr,
               key: Pin<&'static LockClassKey>) -> impl PinInit<Self>
}
```

日常代码不手写 name/key，用宏（`new_spinlock!` 展开即下述形态）：

```rust
let lock = KBox::pin_init(
    try_pin_init!(SpinLock::new(data, c"my_lock", static_lock_class!())?),
    GFP_KERNEL,
)?;
// KBox<Pin<SpinLock<Vec<u8>>>>：分配(4章) + 就地初始化(5章) + 锁(7章)
```

`static_lock_class!()` 用调用处的文件/行号生成锁类目——C 里手动 `lockdep_register_key` 的样板消失。

### 令牌化的中断上下文

`SpinLockIrqBackend`（锁 + 关中断变体）展示了这个体系的伸展方向：

```rust
impl<T> Lock<T, SpinLockIrqBackend> {
    pub fn lock_with<'a>(&'a self,
                         context: &'a LocalInterruptDisabled) -> SpinLockGuard<'a, T>
}
```

`lock_with` 要求你出示一张 `LocalInterruptDisabled` 令牌——只有真正关掉了本地中断的代码才拿得到它。**"调用前提"从注释变成了必须出示的凭证**，这是第一章"不变量进类型"在并发语境的完整版。

## 跨越边界

guard 的限制条款（也是面试高频）：

- **不能存进结构体当字段长期持有**——guard 借用 `&Lock`，生命周期逃出函数就死。想表达"这段数据长期被锁保护"要么重新设计所有权，要么用 `Arc` + 短临界区。
- **不能跨越 FFI 回调边界**——C 回调不知道 guard 的存在，回调重入时再 lock 会死锁。跨边界传的是数据所有权（`ARef`/`ForeignOwnable`，第一、二章），不是锁。
- **持锁范围即数据访问范围**——guard 存在期间 `Deref` 可用，guard 一死数据再次不可达。写小临界区因此是自然的，不是纪律。

## C 与 Rust 对照

同一个"更新计数、按条件唤醒"的临界区：

```c
spin_lock(&dev->lock);
dev->count += 1;
if (dev->count == dev->threshold)
    wake_up(&dev->wq);
spin_unlock(&dev->lock);
/* 忘 unlock / 提前 return 漏 unlock / wake_up 忘持锁 —— 全靠评审 */
```

```rust
let guard = dev.lock.lock();
guard.count += 1;
if guard.count == guard.threshold {
    dev.wq.notify_all();
}
// 离开作用域自动解锁；提前 return 同样安全
```

C 版的三类事故（忘解锁、错误路径漏解锁、无锁访问数据）在 Rust 版里分别是：不可能（Drop）、不可能（沿栈解锁）、编译错误（拿不到 guard 就摸不到数据）。唯一的代价是多一层 guard 间接——而这正是评审省下来的成本的零头。

## 小结

- `lock()` 返回 guard，guard 的生命周期就是临界区：Deref 通道、Drop 解锁、`!Send` 钉住上下文
- `Lock<T, B>` + `Backend`：单一泛型锁类型包装 C 锁对象（`bindings::spinlock_t`），lockdep 免费共享
- 构造走 pin-init 全家桶；`LocalInterruptDisabled` 令牌把"前提"变成"凭证"
- guard 不可长期持有、不可跨 FFI——限制即设计

锁解决"谁能碰这块数据"。最后一类问题是谁拥有这个设备本身——下一章把全部概念装进一个真实的驱动生命周期：[设备模型与驱动抽象](/principles/device-model)。
