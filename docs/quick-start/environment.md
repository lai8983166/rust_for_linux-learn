# 快速上手：最小可运行环境

这一章只有一个目标：**在一台 x86_64 Linux 机器上，编译一个启用了 Rust 支持的内核，并在虚拟机里加载一个 Rust 示例模块。** 全程约一小时。它是后面所有原理章节的实验基础。

<VersionBadge label="本文锚定" kernel="next 树" rustc="1.85" date="2026-10" />

> 徽章含义：本文撰写时以 [docs.kernel.org/next](https://docs.kernel.org/next/rust/quick-start.html)（2026-10 检索）为文档锚点；Ubuntu 24.04 的官方包以 rustc 1.85 为基准。内核 Rust API 演进很快，实操时以你机器上 `make LLVM=1 rustavailable` 的实际输出为准。

## 第 0 步：机器准备

你需要一台 **x86_64 Linux**（物理机或虚拟机均可，建议 ≥16GB 内存、≥40GB 磁盘）。

**Windows / macOS 用户**：用 WSL2（Windows）或 Linux 虚拟机。内核编译与 QEMU 在 WSL2 下均可工作；QEMU 需要 KVM 加速才不卡（WSL2 下可用，macOS 不可）。

以 Ubuntu 为例，先装基础构建依赖：

```bash
sudo apt install git build-essential flex bison libssl-dev libelf-dev \
  qemu-system-x86 clang llvm
```

## 第 1 步：Rust 工具链

推荐用 rustup 管理（发行版包路径见本章末尾速查表）：

```bash
# 在内核源码目录内执行，为该目录固定工具链
rustup override set stable
rustup component add rust-src   # 构建系统需要用它交叉编译 core
```

`rust-src` 是必须的：内核使用 `-Zbuild-std` 风格的构建方式，需要 Rust 标准库源码。

## 第 2 步：bindgen 与 libclang

内核构建时用 bindgen 从 C 头文件生成 Rust 绑定，它依赖 libclang：

```bash
cargo install --locked bindgen-cli
```

如果安装后报找不到 `libclang.so`，设置环境变量指路（路径随发行版不同）：

```bash
export LIBCLANG_PATH=/usr/lib/llvm-19/lib
```

## 第 3 步：获取源码并自检

```bash
git clone --depth 1 https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git
cd linux
make LLVM=1 rustavailable
```

`rustavailable` 是官方提供的自检目标，逐项检查 rustc、rust-src、bindgen、libclang 是否就绪：

```console
$ make LLVM=1 rustavailable
Rust is available!
```

如果输出列出缺什么，按提示补即可。**`make LLVM=1` 是官方推荐路径**——Rust 支持要求 LLVM 工具链，GCC 混合构建"对部分配置可用但非常实验性"。

## 第 4 步：启用 CONFIG_RUST 与示例模块

```bash
make LLVM=1 menuconfig
```

两处配置：

1. **General setup → Rust support** → 启用（只有工具链自检通过时才会出现这一项）
2. **Kernel hacking → Sample kernel code → Rust samples** → 启用示例

对应 `.config` 片段：

```ini
CONFIG_RUST=y
CONFIG_SAMPLES=y
CONFIG_SAMPLE_RUST_MINIMAL=m
```

> 示例模块的 Kconfig 名随内核版本略有差异（新内核还有 `CONFIG_SAMPLE_RUST_HELLO_NO_SYSCALL` 等），在菜单里勾选即可。

## 第 5 步：编译

```bash
make LLVM=1 -j$(nproc)
```

首次全量编译约 20~60 分钟（视机器而定）。编译完成后，`samples/rust/` 下会出现 `*.ko` 模块文件。

## 第 6 步：QEMU 启动

最省事的路径是 [virtme-ng](https://github.com/arighi/virtme-ng)——它直接用当前内核源码树构建产物起一个一次性虚机，免去做 rootfs/磁盘镜像的全部工作：

```bash
pipx install virtme-ng
vng --rw    # 在内核源码目录内运行，进入刚编译的内核
```

> `--rw` 允许写入（默认只读，便于反复实验）；更多用法见 `vng --help`。

也可以走原生 QEMU（自备 rootfs 或 initramfs）：

```bash
qemu-system-x86_64 -enable-kvm -m 2G \
  -kernel arch/x86/boot/bzImage -initrd my-initramfs.cpio.gz \
  -append "console=ttyS0" -nographic
```

## 第 7 步：加载第一个 Rust 模块

进入虚机后（`ls samples/rust/` 查看可用示例，名称随版本不同）：

```console
# insmod /lib/modules/$(uname -r)/kernel/samples/rust/rust_minimal.ko
# dmesg | tail -4
rust_minimal: Rust minimal sample (init)
# rmmod rust_minimal
rust_minimal: Exiting the Rust minimal sample
```

看到这两行日志，说明从工具链到构建系统到模块加载的整条链路都通了。

## Ubuntu 发行版包速查

不想用 rustup 的话，各发行版的包路径（以 Ubuntu 为例，其他发行版见[官方快速开始](https://docs.kernel.org/next/rust/quick-start.html)）：

| Ubuntu 版本 | 做法 |
| --- | --- |
| 26.04 LTS | 直接 `apt install` rust 相关包，仅需导出 `RUST_LIB_SRC` 指向 rustc 库源码路径 |
| 24.04 LTS | 需版本化包：`rustc-1.85`、`rust-1.85-src`、`bindgen-0.71`，并在 make 时传 `RUSTC=rustc-1.85 BINDGEN=bindgen-0.71` 等变量 |
| ≤22.04 | 不推荐，bindgen 需自行从源码构建 |

## 常见问题

- **menuconfig 里没有 Rust support 选项**：说明工具链自检没过，回到第 3 步看 `rustavailable` 的输出。
- **bindgen 报 libclang 版本过旧**：安装发行版的新版 llvm 包并设置 `LIBCLANG_PATH`。
- **编译报 `error: can't find crate for core`**：`rustup component add rust-src` 没装，或在错误的目录用了错误的工具链（检查 `rustup override` 列表）。

## 下一步

环境已就绪。接下来进入原理篇第一章：[安全抽象的哲学](/principles/safety-philosophy)——看一个 C 函数是如何被包装成不可能被误用的 Rust API 的。
