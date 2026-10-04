---
title: 设备模型与驱动抽象
---

# 设备模型与驱动抽象

设备模型是 C 与 Rust 边界最复杂的地方：驱动的生命周期不由你掌控——内核随时可能 probe、unbind、再 probe 你的设备。这一章拆解 `platform` 驱动抽象如何把这条被 C 驱动框架支配的生命周期翻译成 Rust 的所有权语言，也是全教程的合流点：前七章的每一个概念都会在此现身。

<VersionBadge label="本文锚定" kernel="master 树" date="2026-10" />

> API 事实对照 [torvalds/linux master 的 `rust/kernel/platform.rs`](https://github.com/torvalds/linux/blob/master/rust/kernel/platform.rs)核实（2026-10 检索）。注意：驱动抽象近两年重构频繁（probe 签名、Data 生命周期都有变化），本章以 master 为准，读旧代码时注意甄别。

## 平台驱动抽象

### Driver trait：probe 的返回值是重点

真实声明（仅省略文档注释）：

```rust
pub trait Driver {
    type IdInfo: 'static;
    type Data<'bound>: Send + 'bound;

    const OF_ID_TABLE: Option<of::IdTable<Self::IdInfo>> = None;
    const ACPI_ID_TABLE: Option<acpi::IdTable<Self::IdInfo>> = None;

    fn probe<'bound>(
        dev: &'bound Device<device::Core<'_>>,
        id_info: Option<&'bound Self::IdInfo>,
    ) -> impl PinInit<Self::Data<'bound>, Error> + 'bound;

    fn unbind<'bound>(dev: &'bound Device<device::Core<'_>>,
                      this: Pin<&Self::Data<'bound>>) {
        let _ = (dev, this);
    }
}
```

四个签名细节，每个都是一章的回声：

1. **`probe` 返回 `impl PinInit<Data>` 而不是 `Data`**——第五章的直接应用：驱动数据经常含锁、workqueue 等不可移动对象，驱动核心在你的初始化器外面**分配最终内存、就地执行、直接钉住**。你从始至终没有机会移动它，也就没有机会制造悬垂。
2. **`Data<'bound>` 带生命周期参数**——驱动数据的存活范围被类型化为"绑定（bound）到设备引用的存活期"。设备消失，数据的类型就不再合法。C 里"deregister 之后别再碰 drvdata"的人肉规则，变成了生命周期检查。
3. **`unbind` 不是 `remove`，而且有默认实现**——官方文档说得很直白：需要 `&Device` 引用的收尾放 `unbind`，**其余清理一律放 `Data` 的 `Drop`**。C 版 remove 函数里那一长串逆序反注册，在这里是 `Drop` 沿字段自动执行——第三章 goto 链的最终章版本。
4. **`OF_ID_TABLE` / `ACPI_ID_TABLE` 是关联常量**——设备匹配表（设备树 compatible 字符串 / ACPI HID）成为类型的一部分，配 `of_device_table!` 宏声明：

```rust
kernel::of_device_table!(
    OF_TABLE,
    <MyDriver as platform::Driver>::IdInfo,
    [(of::DeviceId::new(c"test,device"), ())]   // compatible 串 + 私有数据
);
```

### 注册：一个宏封口

模块入口由 `module_platform_driver!` 完成（真实文档示例）：

```rust
kernel::module_platform_driver! {
    type: MyDriver,
    name: "Module name",
    authors: ["Author name"],
    description: "Description",
    license: "GPL v2",
}
```

它的展开（`platform.rs` 内 `Adapter<T>` 的实现）填好 C 的 `platform_driver` 结构：probe/remove 回调、of/acpi 匹配表指针，然后调用 `bindings::__platform_driver_register(pdrv, module, name)`——第二章那张分层图最右端的落点。C 回调进来后，`probe_callback` 把 Rust 初始化器落到驱动核心分配的内存里并 `set_drvdata`；`remove_callback` 取回 drvdata、调用你的 `unbind`，随后 `Data` 被 Drop。

## 资源管理：devm 的精神续作

C 驱动的资源管理靠 devm（devm_kzalloc、devm_iorequest_region……设备移除时自动释放）。Rust 侧不需要专门学一套 devm API——**RAII 就是 devm 的泛化**：

- `KBox`/`KVec`（第四章）离开作用域自动释放——而 probe 失败的早退路径，正是 C 里最需要 devm 的场景；
- ioremap、irq、clk 等资源的包装类型（`io`、`irq`、`clk` 模块）同样 guard 化（第七章模式），`devres` 模块则提供与设备生命周期绑定的托管注册；
- probe 返回的 `PinInit` 失败时，已执行的字段初始化器各自回滚——初始化器框架自带"构造到一半"的清理语义。

一句话：**devm 在 C 里是特例机制，在 Rust 里是所有权系统的日常**。

## 最小 Rust 平台驱动

把以上全部组装起来（骨架据 `platform.rs` 文档示例改编，`Data` 换成有状态的真实形态）：

```rust
use kernel::{of, platform, prelude::*, sync::SpinLock};

struct MyDriver;

kernel::of_device_table!(
    OF_TABLE,
    <MyDriver as platform::Driver>::IdInfo,
    [(of::DeviceId::new(c"acme,foo"), ())],
);

struct FooData {
    count: SpinLock<u32>,      // 不可移动 → 整个 FooData 不可移动 → pin-init 登场
}

impl platform::Driver for MyDriver {
    type IdInfo = ();
    type Data<'bound> = FooData;
    const OF_ID_TABLE: Option<of::IdTable<Self::IdInfo>> = Some(&OF_TABLE);

    fn probe<'bound>(
        _pdev: &'bound platform::Device<platform::device::Core<'_>>,
        _id_info: Option<&'bound Self::IdInfo>,
    ) -> impl PinInit<FooData, Error> + 'bound {
        try_pin_init!(FooData {
            count <- new_spinlock!(0, c"foo_count"),
        })
    }

    fn unbind<'bound>(
        _pdev: &'bound platform::Device<platform::device::Core<'_>>,
        _this: Pin<&FooData>,
    ) {
        // 需要 `&Device` 的收尾才放 unbind；这里演示日志，其余清理在 FooData 的 Drop
        pr_info!("foo: bye\n");
    }
}

kernel::module_platform_driver! {
    type: MyDriver,
    name: "foo",
    authors: ["Rust for Linux 学习者"],
    description: "最小平台驱动",
    license: "GPL",
}
```

等价的 C 驱动需要：`platform_driver` 结构 + `of_match_id` 表 + probe 里 `devm_kzalloc`/`spin_lock_init` + remove 里手工反注册 + `module_platform_driver()` 宏。行数相近，但 C 版的全部错误路径（probe 半途失败、remove 漏清理、unbind 后访问）在 Rust 版里要么自动、要么编译期拒绝。

## 综合：前八章概念在此合流

| 正文概念 | 在本章的化身 |
| --- | --- |
| 安全抽象分层（第 1 章） | `Adapter` 回调是抽象层内部 unsafe 的集中地 |
| crate 结构（第 2 章） | `platform`/`of`/`devres` 模块各司其职 |
| `Result`/`?`（第 3 章） | `probe` 返回 `PinInit<_, Error>`，失败自动传播 |
| GFP/分配器（第 4 章） | 驱动核心为 `Data` 分配内存（你无需关心，但模型一致） |
| pin-init（第 5 章） | `probe` 返回初始化器；`Data` 就地构造并钉住 |
| unstable 特性（第 6 章） | `arbitrary_self_types` 令 `ARef` 方法接收者成为可能 |
| guard（第 7 章） | `FooData` 内嵌 `SpinLock`，锁保护随数据走 |
| 版本锚定（贯穿） | 本章 API 是全教程重构最频繁的区域 |

## 小结

- `Driver` trait 的三件套：`Data<'bound>` 生命周期化设备绑定、`probe` 返回 `PinInit`、清理分工 `unbind`（需设备引用）+ `Drop`（其余全部）
- 注册由 `module_platform_driver!` 一键封口，`Adapter` 在抽象层内填 C 回调
- devm 的精神被所有权系统泛化：RAII 即托管资源
- 驱动是全部概念的应用题——也是检验你是否读懂前八章的试金石

到此，运行时的一切讲完了。还剩最后一问：这些 `.rs` 文件是怎么变成内核镜像一部分的？[下一章：构建系统：Kbuild 与 bindgen](/principles/build-system)。
