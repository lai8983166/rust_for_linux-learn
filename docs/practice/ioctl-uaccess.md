---
title: P5：ioctl 与用户内存
---

# P5：ioctl 与用户内存

read/write 是数据面；设备还需要控制面——查询队列积压量、清空队列，这类操作用 `ioctl` 最自然。这章顺带直面内核编程最锋利的边界：**用户态指针**。一个会解引用用户指针的驱动若漏了检查，就是内核漏洞的起点；Rust 的 `UserSlice` 把这条边界变成了带检查的类型。

<VersionBadge label="本文锚定" kernel="master 树" date="2026-10" />

> 对照 [`rust/kernel/ioctl.rs`](https://github.com/torvalds/linux/blob/master/rust/kernel/ioctl.rs)与 [`rust/kernel/uaccess.rs`](https://github.com/torvalds/linux/blob/master/rust/kernel/uaccess.rs)核实（2026-10 检索），代码形态与官方示例的 ioctl 段一致。

## 命令编码：_IO 家族

ioctl 命令是一个 32 位编码，打包了方向（读/写）、类型魔数、序号、参数大小四个字段。内核提供与 C 宏同名的 `const fn`（[第 9 章](/principles/build-system)说过，这类工具函数在 `kernel::ioctl`）：

```rust
use kernel::ioctl::{_IO, _IOC_SIZE, _IOR};

const RUSTYRING_GET_LEN: u32 = _IOR::<u32>('|' as u32, 0x90); // 内核 → 用户，载荷 u32
const RUSTYRING_RESET: u32 = _IO('|' as u32, 0x91);           // 无载荷
```

- 魔数 `'|'` 是类型标识，用来区分"这个 ioctl 是发给哪类设备"的——撞车的命令编码是经典用户态 bug
- `_IOR::<u32>` 的泛型参数自动算出载荷大小并编进命令位——用户态与内核侧**用同一公式**编码，天然一致
- 解码侧用 `_IOC_SIZE(cmd)` 取回载荷大小（马上用到）

## 用户内存：UserSlice 的合同

ioctl 的 `arg: usize` 按约定是**用户态指针**。内核里直接解引用它 = 崩溃或漏洞，必须经 `copy_from_user`/`copy_to_user` 家族。`uaccess` 模块的封装合同（源码文档原话）：

- `UserSlice::new(ptr, len)` **不做任何校验**——地址合法性在真正拷贝时由 C 助手检查，坏地址返回 `EFAULT`（经 `?` 传播，[第 3 章](/principles/error-handling)），所以不需要也不存在单独的 `access_ok` 步骤
- `.reader()` 得到 `UserSliceReader`（用户 → 内核），`.writer()` 得到 `UserSliceWriter`（内核 → 用户）
- 并发是**允许**的：用户态同时改这块内存，得到的是"未指定的字节"而非 UB——驱动侧读到的数据必须在使用前自行校验

```rust
use kernel::uaccess::{UserPtr, UserSlice};

let ptr = UserPtr::from_addr(arg);        // arg: usize → 用户指针
let size = _IOC_SIZE(cmd);                // 命令编码里声明的载荷大小
UserSlice::new(ptr, size).writer()        // 内核 → 用户方向
```

## 实现：两个 ioctl

给 `Rustyring` 加内部控制方法（不进 vtable，普通方法即可），再接进 trait：

```rust
impl Rustyring {
    /// RUSTYRING_GET_LEN：把当前积压字节数写给用户
    fn get_len(&self, mut writer: UserSliceWriter) -> Result<isize> {
        let guard = self.inner.lock();
        let len = guard.len as u32;
        drop(guard);                       // 拷贝前先放锁：临界区只碰内核数据
        writer.write::<u32>(&len)?;
        Ok(0)
    }

    /// RUSTYRING_RESET：清空队列
    fn reset(&self) -> Result {
        let mut guard = self.inner.lock();
        guard.head = 0;
        guard.len = 0;
        Ok(())
    }
}
```

trait 侧的 `ioctl` 负责解码分发（形态对照官方示例）：

```rust
fn ioctl(me: Pin<&Rustyring>, _file: &File, cmd: u32, arg: usize) -> Result<isize> {
    // ioctl 参数按约定是用户指针
    let ptr = UserPtr::from_addr(arg);
    let size = _IOC_SIZE(cmd);
    match cmd {
        RUSTYRING_GET_LEN => me.get_len(UserSlice::new(ptr, size).writer())?,
        RUSTYRING_RESET => me.reset()?,
        _ => {
            dev_err!(me.dev, "rustyring: 未知 ioctl 命令 {cmd}\n");
            return Err(ENOTTY);
        }
    }
    Ok(0)
}
```

读一遍这套流程的防御纵深：未知命令返回 `ENOTTY`（而非静默成功）；`arg` 不被解引用而只被包装；载荷大小取自命令编码而非信任用户；真正拷贝时坏地址自动 `EFAULT`。C 驱动里这四条全靠开发者记全——漏掉任何一条都是 CVE 素材，这里它们是**默认路径**。

import 补充：

```rust
use kernel::uaccess::{UserPtr, UserSlice, UserSliceWriter};
use kernel::ioctl::{_IO, _IOC_SIZE, _IOR};
```

## 用户态测试程序

在虚机里写个用户态小程序（内核树外，普通 gcc 即可），`misc/rustyring_test.c`：

```c
// SPDX-License-Identifier: GPL-2.0
#include <fcntl.h>
#include <stdio.h>
#include <sys/ioctl.h>
#include <unistd.h>

#define RUSTYRING_MAGIC '|'
#define RUSTYRING_GET_LEN _IOR(RUSTYRING_MAGIC, 0x90, unsigned int)
#define RUSTYRING_RESET  _IO(RUSTYRING_MAGIC, 0x91)

int main(void)
{
    int fd = open("/dev/rustyring", O_RDWR);
    unsigned int len;

    write(fd, "hello", 5);
    write(fd, "world", 5);

    ioctl(fd, RUSTYRING_GET_LEN, &len);
    printf("积压 %u 字节\n", len);          /* 期望 10 */

    char buf[6] = {0};
    read(fd, buf, 5);
    printf("读出 %.5s\n", buf);              /* 期望 hello */

    ioctl(fd, RUSTYRING_RESET);
    ioctl(fd, RUSTYRING_GET_LEN, &len);
    printf("清空后积压 %u 字节\n", len);     /* 期望 0 */

    close(fd);
    return 0;
}
```

::: tip UAPI 与语言无关
C 的 `_IOR(magic, nr, type)` 宏与 Rust 的 `_IOR::<u32>(magic, nr)` 编码公式相同——**用户态完全不必知道内核侧用什么语言实现**。ioctl 是稳定 UAPI，这正是混合语言内核的立身之本。
:::

## 验证

```bash
make LLVM=1 -j$(nproc)     # 内核侧
# 虚机内编译用户态测试（virtme-ng 环境里有 gcc 的话；或交叉编译后放进 rootfs）
gcc -o rustyring_test rustyring_test.c
```

```console
# insmod /lib/modules/$(uname -r)/kernel/samples/rust/rustyring.ko
# ./rustyring_test
积压 10 字节
读出 hello
清空后积压 0 字节
# dmesg | tail -2
rustyring: 打开设备（队列容量 4096）
rustyring: 设备状态销毁
```

再试一个越界命令（比如 `echo` 一段），确认 `ENOTTY` 路径与 `dev_err!` 日志同时出现。

## 排障速查

| 症状 | 方向 |
| --- | --- |
| ioctl 返回 `-1`（`ENOTTY`） | 用户态与内核的魔数/序号/载荷类型不一致——两侧公式对照（`_IOR(magic, nr, type)`） |
| `EFAULT` | 用户缓冲区指针无效或大小小于载荷；检查 `&len` 是否传了值而非地址 |
| GET_LEN 数值诡异 | 检查 `get_len` 是否在 `drop(guard)` **之后**才 `write`（临界区最小化） |
| RESET 后读出旧数据 | `reset` 是否只清了 `len` 没归零 `head`（本章实现两者都归零） |

## 当前完整代码

::: details samples/rust/rustyring.rs（P5 版，新增部分）
在 P4 完整代码基础上，做三处增量：

```rust
// 1) import 增加
use kernel::ioctl::{_IO, _IOC_SIZE, _IOR};
use kernel::uaccess::{UserPtr, UserSlice, UserSliceWriter};

// 2) 常量与内部控制方法
const RUSTYRING_GET_LEN: u32 = _IOR::<u32>('|' as u32, 0x90);
const RUSTYRING_RESET: u32 = _IO('|' as u32, 0x91);

impl Rustyring {
    fn get_len(&self, mut writer: UserSliceWriter) -> Result<isize> {
        let guard = self.inner.lock();
        let len = guard.len as u32;
        drop(guard);
        writer.write::<u32>(&len)?;
        Ok(0)
    }

    fn reset(&self) -> Result {
        let mut guard = self.inner.lock();
        guard.head = 0;
        guard.len = 0;
        Ok(())
    }
}

// 3) MiscDevice impl 内追加
fn ioctl(me: Pin<&Rustyring>, _file: &File, cmd: u32, arg: usize) -> Result<isize> {
    let ptr = UserPtr::from_addr(arg);
    let size = _IOC_SIZE(cmd);
    match cmd {
        RUSTYRING_GET_LEN => me.get_len(UserSlice::new(ptr, size).writer())?,
        RUSTYRING_RESET => me.reset()?,
        _ => {
            dev_err!(me.dev, "rustyring: 未知 ioctl 命令 {cmd}\n");
            return Err(ENOTTY);
        }
    }
    Ok(0)
}
```
:::

rustyring 功能齐了。最后一章收拾战场：日志策略、故障排查方法、测试出路，以及这个设备还能往哪长。[P6：调试与收尾](/practice/debug-wrapup)
