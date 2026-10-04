# write-remaining-chapters

## Why

原理篇前三章已完成（归档 change `2026-10-04-write-principles-ch1-3`），写作模式与质量标准已验证。剩余 10 页（原理篇后六章 + 展望 + 3 附录）仍是占位页，需要全部实写以完成教程首轮内容闭环。

## What Changes

- 实写原理篇第 4-9 章：
  - `allocation.md`：无全局分配器、GFP 作为类型状态参数、KBox/KVec 家族、Drop 与释放路径
  - `pinning-init.md`：内核对象为何不可移动、Pin 入门、#[pin_data] 与 pin-init API、Opaque 未初始化内存、字段投影
  - `unstable-features.md`：-Zallow-features 白名单、内核依赖的 unstable 特性盘点、为何不能等 stable、发行版影响
  - `synchronization.md`：guard 即临界区、SpinLock/Mutex/CondVar、guard 跨界限制、C/Rust 对照
  - `device-model.md`：平台驱动抽象、probe/remove 生命周期、devm 资源、最小驱动对照、前章概念合流
  - `build-system.md`：.rs 到内核产物、bindgen 工作方式与 allowlist、crate 依赖图、EXPORT_SYMBOL_GPL 桥接
- 实写 `outlook/future.md`（展望与学习路线）
- 实写附录 3 页：C↔Rust 映射速查表、中英术语表、参考文献
- 全部 API 事实对照 torvalds/linux master 树核实，延续版本锚定徽章

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `principles-content`: 新增"全部章节实写完成"要求——教程 15 个页面全部为成文内容（无占位残留），并补充附录页的内容要求（映射表条目、术语表条目、参考文献分类）

## Impact

- 改动 `docs/principles/` 6 个文件、`docs/outlook/` 1 个、`docs/appendix/` 3 个
- 不改配置、主题、导航结构
- `principles-content` spec 由本 change 的 delta 扩充，归档时合入主 spec
