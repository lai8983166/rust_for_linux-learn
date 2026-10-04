---
title: C↔Rust 映射速查表
---

# C↔Rust 映射速查表

把九章正文讲过的对应关系压成一页速查。**所有条目与正文讲授内容一致**（标注来源章节），锚定 torvalds/linux master（2026-10）；语义细节回对应章节看。

## 内存与分配（第 4 章）

| C 惯用法 | Rust 对应物 | 语义备注 |
| --- | --- | --- |
| `kmalloc(size, gfp)` / `kzmalloc` | `KBox::new(t, flags)` / 家族 `KBox`·`VBox`·`KVBox` | 分配器是类型参数：`KVec<T> = Vec<T, Kmalloc>` 等 |
| `kcalloc(n, size, gfp)` | `KVec::zeroed(n, flags)` | 要求 `T: Zeroable` |
| 预分配数组 | `KVec::with_capacity(cap, GFP_KERNEL)?` | 失败返回 `Err(AllocError)`，`?` 自动转 `ENOMEM` |
| `krealloc` 扩容 | `v.push(elem, flags)?` | 每个可能分配的方法都带 `Flags` |
| GFP 宏（`GFP_KERNEL` 等） | `Flags(u32)` 新类型 + `alloc::flags` 常量 | 宏对 bindgen 不可见，经 `RUST_CONST_HELPER_*`（第 9 章） |
| `vmalloc` 大缓冲 | `VVec<T>`（`Vmalloc` 后端） | 虚拟连续即可时省物理内存 |
| `kfree` 配对释放 | `Drop` 自动释放 | 逃生舱：`into_raw_parts` / `from_raw_parts` |

## 错误与控制流（第 3 章）

| C 惯用法 | Rust 对应物 | 语义备注 |
| --- | --- | --- |
| `return -ENOMEM;` | `Err(ENOMEM)` / `code::*` 常量 | `Error(NonZeroI32)` 不变量：合法负 errno |
| `ERR_PTR` / `IS_ERR` / `PTR_ERR` | `from_err_ptr(ptr)` / `Error::to_ptr()` | 进 Rust / 出 C 的边界函数；`NULL` 视为 `Ok` |
| 函数返回 `int`（0 或负 errno） | `Result`（默认 `Result<(), Error>`） | 给 C 回调适配用 `from_result` |
| `goto err_XXX:` 清理链 | `?` 提前返回 + 沿栈 `Drop` | 逆序释放由作用域免费保证 |
| `EPROBE_DEFER` 稍后重试 | `Err(EPROBE_DEFER)` 原样返回 | 错误码是调度信号，语义完整保留 |

## 同步与生命周期（第 1、7 章）

| C 惯用法 | Rust 对应物 | 语义备注 |
| --- | --- | --- |
| `spin_lock` / `spin_unlock` 配对 | `lock() -> Guard`，guard `Drop` 解锁 | 持锁期 = guard 生命周期；`!Send` 钉住上下文 |
| `spin_lock_init` + lockdep key | `SpinLock::new(data, name, static_lock_class!())` | 名字/锁类目宏生成，lockdep 免费共享 |
| `spin_lock_irqsave/restore` | `lock_with(&LocalInterruptDisabled)` | 令牌证明中断已关；`SpinLockIrqBackend` |
| `get_device` / `put_device`（`refcount_t`） | `ARef<T: AlwaysRefCounted>` | `From<&T>` 增计数、`Drop` 减计数，泄漏/UAF 不可写 |
| 把数据交给 C 回调持有 | `ForeignOwnable`（`into_foreign`/`from_foreign`） | 所有权穿越 FFI 边界的协议 |
| 局部临时清理（尚无专用类型） | `ScopeGuard<T, F: FnOnce(T)>` | 通用 RAII 清理守卫 |

## 设备与驱动（第 8 章）

| C 惯用法 | Rust 对应物 | 语义备注 |
| --- | --- | --- |
| `platform_driver` + `of_match_id` 表 | `platform::Driver` trait + `OF_ID_TABLE`（`of_device_table!`） | 匹配表是关联常量 |
| `probe` 返回 0/-errno，`devm_kzalloc` 建状态 | `probe` 返回 `impl PinInit<Data, Error>` | 驱动核心就地分配并钉住（第 5 章） |
| `remove` 里逆序反注册 | `unbind`（需 `&Device`）+ `Drop`（其余全部） | 清理责任一分为二 |
| `dev_set_drvdata` / `platform_get_drvdata` | `Data<'bound>` 生命周期化；drvdata 由 `Adapter` 内部管理 | 设备消失则数据类型不合法 |
| `module_platform_driver()` 宏 | `module_platform_driver! { type, name, ... }` | 元信息声明式书写 |
| `dev_info` / `pr_err` 日志 | `dev_info!` / `pr_err!` 宏 | 返回值给机器，日志给人（第 3 章） |
| devm 托管资源 | RAII 即泛化的 devm | guard/`Drop`/初始化器回滚三件套 |

## 使用提醒

- 映射是**语义级**的：C 侧"约定 + 评审"保证的事，Rust 侧变成"类型 + 编译器"——迁移老代码时先迁移不变量，再迁移动作
- 个别 API 形态随内核版本漂移（第 2 章的 ARef 搬家就是先例），以你手上的源码树为准
- 找不到对应物？那是抽象缺口——查 `rust/kernel/` 模块与 `RUST_*_ABSTRACTIONS` 开关（第 9、展望章）
