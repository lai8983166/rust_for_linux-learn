---
title: 错误处理：Result 与 errno
---

# 错误处理：Result 与 errno

错误处理是 C 与 Rust 两个世界接触最频繁的界面：几乎每个跨越边界的调用都携带错误信息。这一章看 `kernel::error` 如何把 C 的 errno 惯用法收编为类型——它是 `kernel` crate 里最小的模块，却是理解一切跨边界代码的钥匙。

<VersionBadge label="本文锚定" kernel="master 树" date="2026-10" />

> API 事实对照 [torvalds/linux master 的 `rust/kernel/error.rs`](https://github.com/torvalds/linux/blob/master/rust/kernel/error.rs)核实（2026-10 检索）。

## 从 errno 说起

C 内核的错误处理建立在三条**口头约定**上：

1. **整数返回值**：成功返回 `0`，失败返回负 errno（`return -ENOMEM;`）。
2. **指针编码**：本该返回指针的函数用 `ERR_PTR(-ENOMEM)` 把错误塞进指针值，调用方用 `IS_ERR(p)` 判错、`PTR_ERR(p)` 取回错误码。
3. **goto 清理链**：失败路径跳到函数尾部的 `err_XXX:` 标签，按获取的相反顺序手动释放资源。

约定本身优雅，问题在于**没有任何机器检查**。于是内核里长年繁殖着这几类 bug：

```c
struct device *d = get_device();
setup(d);              // bug 1：忘了 IS_ERR 检查就使用，
                       //        d 可能是编码着错误的伪指针

ret = do_something();
if (ret)               // bug 2：某些函数返回正 errno，符号约定悄悄断裂
    return ret;

p = get_or_null();     // bug 3：这个 API 失败返回 NULL，那个返回 ERR_PTR，
if (IS_ERR(p))         //        记错就是漏判或误判
    return PTR_ERR(p);
```

至于 goto 清理链，每新增一种资源就要在所有错误出口补一行释放——遗漏一处就是泄漏。**这些不是低级失误，而是约定式错误处理的结构性成本。**

## kernel::error 的设计

`rust/kernel/error.rs` 的核心是一个把 errno 约定变成类型不变量的新类型：

```rust
pub struct Error(NonZeroI32);   // 不变量：值是合法 errno（>= -MAX_ERRNO 且 < 0）
```

三个设计点：

- **`NonZeroI32`**：错误"永不为零"这条 C 口头约定，变成类型事实。`Result<T>` 的 `Err` 变体因此不可能容纳"成功"，空指针优化也免费获得。
- **构造受控**：`Error::from_errno(errno)` 对越界输入告警并退回 `EINVAL`；`const fn try_from_errno` 返回 `Option`；`unsafe fn from_errno_unchecked` 留给已验证的热路径。非法错误码无法悄悄溜进类型。
- **配套类型别名**：`pub type Result<T = (), E = Error> = core::result::Result<T, E>;`——内核代码里最常见的一行签名 `-> Result` 即 `Result<(), Error>`，成功无返回值、失败带 errno，与 C 的习惯语义对齐。

错误码常量收编在 `code` 模块中，由 `declare_err!` 宏从 C 头文件机械生成，从根上避免两边头文件漂移：

```rust
use kernel::error::code::*;

let e: Error = ENOMEM;   // EPERM, ENOENT, EIO, EINVAL, ENODEV,
                         // ENOSPC, ETIMEDOUT, ECONNREFUSED, ...
                         // 以及内核内部的 ERESTARTSYS, EPROBE_DEFER 等
```

两处细节见功力。其一，`impl From<AllocError> for Error` 一类的转换把"Rust 世界的错误"收敛为 errno：`AllocError`→`ENOMEM`、`TryFromIntError`→`EINVAL`、`LayoutError`→`ENOMEM`、`fmt::Error`→`EINVAL`——下游只需面向 `Error` 编程。其二，`impl fmt::Debug for Error` 打印的是**符号名**而非数字（`ENOMEM` 而非 `-12`），日志可读性与 C 侧 `perror` 习惯对齐。

## 两套世界观的映射

同一个函数，两种写法。C 版（goto 清理链）：

```c
int my_init(struct thing **out)
{
    struct resource *a;
    int ret;

    a = alloc_resource();
    if (IS_ERR(a))
        return PTR_ERR(a);

    ret = setup(a);
    if (ret)
        goto err_free_a;

    *out = build_thing(a);
    return 0;

err_free_a:
    free_resource(a);
    return ret;
}
```

Rust 版（`?` 传播 + Drop 清理）：

```rust
fn my_init() -> Result<Thing> {
    let a = alloc_resource()?;   // from_err_ptr：ERR_PTR → Err 自动转换
    let a = setup(a)?;           // to_result：负 errno → Err 自动转换
    Ok(build_thing(a))           // a 离开作用域时由 Drop 自动释放
}
```

错误出口消失了：`?` 在失败时提前返回，资源清理交给 `Drop` 沿栈自动逆序执行——goto 链要人工维护的"相反顺序释放"，被作用域结构免费保证。

桥接由四个边界函数完成（均为真实签名）：

```rust
// C 返回 int（0 或负 errno）→ Result
pub fn to_result(err: c_int) -> Result

// C 返回指针（ERR_PTR 编码错误，NULL 视为成功）→ Result<*mut T>
pub fn from_err_ptr<T>(ptr: *mut T) -> Result<*mut T>

// Result → C 回调需要的返回形态
pub fn from_result<T, F>(f: F) -> T
where
    T: From<i16>,
    F: FnOnce() -> Result<T>,

// Error → ERR_PTR 指针（实现返回指针的 C 回调时用）
impl Error {
    pub fn to_ptr<T>(self) -> *mut T { /* ... */ }
}
```

方向感很重要：**进入 Rust 世界用前两个，离开回到 C 世界用后两个**。注意 `from_err_ptr` 对 `NULL` 的处理是返回 `Ok(NULL)`——"空指针在不少 C API 里是成功语义"，这种约定差异被集中在边界函数里，而不是散落在每个调用点（第六、九章会看到它们在 probe/remove 等回调里的实战用法）。

## 传播与人体工学

`?` 运算符在内核代码里的威力来自 `From` 转换的完备性。上面那张转换表意味着：

```rust
fn grow(&self) -> Result {
    let buf: KVec<u8> = KVec::with_capacity(64, GFP_KERNEL)?;
    //                        ^ 失败类型是 AllocError，
    //                          `?` 经 From<AllocError> 自动变为 Error
    ...
}
```

错误在传播途中自动"降级"为统一的 errno 语义，无需逐层手写映射。而当你需要区分具体错误时，模式匹配照常可用：

```rust
match probe_device() {
    Ok(dev) => return Ok(dev),
    Err(e) if e == EPROBE_DEFER => /* 告诉驱动核心稍后重试 probe */,
    Err(e) => return Err(e),
}
```

`EPROBE_DEFER` 是值得认识的内核特有错误码：probe 依赖的资源未就绪时返回它，驱动核心会把设备挂起、等依赖就位后再重试。它不是失败，是**调度信号**——errno 体系在 C 里承担的远不止"报错"，这些语义被原样保留进了 `code` 模块。

最后两个工程细节：

- **`#[vtable]` 的默认方法哨兵**：`error.rs` 导出常量 `VTABLE_DEFAULT_ERROR`，`#[vtable]` 派生的 trait 里未实现的方法返回它，让"ops 表缺实现"在运行时立刻暴露为明确错误而非静默空操作。
- **日志与错误分离**：Rust 没有异常，报告错误就是返回 `Err`；给人看的输出走 `dev_err!`/`pr_err!` 日志宏。两条通道不要混淆——返回值给机器，日志给 `/var/log/kern.log`。

## 小结

- C 的 errno/`ERR_PTR`/goto 链是纯约定，误用无编译期防线
- `Error(NonZeroI32)` + `code::*` 把约定变成类型；`From` 转换表把 Rust 错误收敛为 errno
- `?` + `Drop` 取代 goto 清理链，"逆序释放"由作用域免费保证
- 边界函数四件套：`to_result`/`from_err_ptr` 进，`from_result`/`to_ptr` 出

错误是最简单的跨界对象——它只是一个数。当跨界对象变成**内存**时，约定与类型的冲突将激烈得多。下一章：[内存分配：KBox/KVec 与 GFP](/principles/allocation)。
