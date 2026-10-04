## 1. 事实核实

- [x] 1.1 核实 `samples/rust/` 目录现状与 `rust_miscdevice.rs`（或现行等价示例）全文：module 宏形态（属性宏还是宏）、misc 注册样板、文件操作 trait 用法
- [x] 1.2 核实 `rust/kernel/miscdevice.rs`（Registration/MiscDevice trait 的 open/read/write/ioctl 真实签名）与 `rust/kernel/uaccess.rs`（UserSlice API）

## 2. 站点导航

- [x] 2.1 config.mts 侧边栏加"实战篇"分组（6 页，原理篇之后）+ nav 入口，`pnpm docs:build` 通过后提交

## 3. 实战篇六章

- [x] 3.1 写 `practice/overview.md`（成果物 rustyring、路线图、前置环境、与原理篇的关系），提交
- [x] 3.2 写 `practice/first-module.md`（树内子目录、Kconfig/Makefile、module 宏、构建加载卸载、dmesg 验证），提交
- [x] 3.3 写 `practice/misc-device.md`（misc 注册、open/read/write 回环、/dev 验证），提交
- [x] 3.4 写 `practice/state-and-sync.md`（SpinLock+KVec 环形缓冲、读写语义、并发验证），提交
- [x] 3.5 写 `practice/ioctl-uaccess.md`（命令编码、UserSlice、长度查询/清空两个 ioctl），提交
- [x] 3.6 写 `practice/debug-wrapup.md`（日志等级策略、故障排查表、KUnit 指路、收尾与下一步），提交

## 4. 验证与归档

- [x] 4.1 `pnpm docs:build` 通过；产物含 21 页；全站无 TODO/占位残留；新章徽章抽查
- [x] 4.2 核对 spec 场景（章间衔接、API 可溯源、验证方法齐全、侧边栏四组），勾任务，`openspec archive write-practice-series --yes`，最终提交
