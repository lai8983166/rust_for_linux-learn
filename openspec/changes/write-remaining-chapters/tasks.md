## 1. 事实核实

- [ ] 1.1 核实 alloc 模块（KBox/KVec/KVBox/VBox 家族、Flags trait、GFP 常量、构造函数真实签名——重点复核第三章用过的 `KVec::with_capacity(cap, flags)`），记录与正文的出入
- [ ] 1.2 核实 sync/lock（guard 设计、SpinLock/Mutex 构造与 lock() 签名）、pin-init（#[pin_data]/pin_init!/try_pin_init!/InPlaceInit/Opaque 配合）
- [ ] 1.3 核实 platform/driver（Driver trait、Registration、probe 形态）与 rust/Makefile、bindings_helper.h（bindgen 调用与 allowlist 机制）

## 2. 原理篇第 4-9 章

- [ ] 2.1 实写 `allocation.md`（无全局分配器、GFP 类型状态、KBox/KVec 家族、Drop 释放路径），若 1.1 发现第三章示例签名有误则回改 error-handling.md，一并提交
- [ ] 2.2 实写 `pinning-init.md`（不可移动性、Pin、#[pin_data] 与 pin-init、Opaque 未初始化、字段投影），提交
- [ ] 2.3 实写 `unstable-features.md`（-Zallow-features 白名单、特性盘点、治理与发行版影响），提交
- [ ] 2.4 实写 `synchronization.md`（guard 即临界区、构造/加锁签名、跨界限制、C 对照），提交
- [ ] 2.5 实写 `device-model.md`（平台驱动、probe/remove、devm、最小驱动对照、前章概念合流），提交
- [ ] 2.6 实写 `build-system.md`（.rs 到产物、bindgen 与 allowlist、crate 依赖图、符号桥接），提交

## 3. 展望与附录

- [ ] 3.1 实写 `outlook/future.md`，提交
- [ ] 3.2 实写 `appendix/c-rust-mapping.md`（四大类别对照表，条目与正文一致）、`appendix/glossary.md`（收录正文全部术语）、`appendix/references.md`（三类组织），一次提交

## 4. 验证与归档

- [ ] 4.1 `pnpm docs:build` 通过；grep 全站源文件确认无 TODO 与"内容撰写中"残留；抽查产物含新章正文
- [ ] 4.2 核对本 change spec 各场景（全站无占位、映射可溯源、术语一一对应、参考文献三类），勾完任务，`openspec archive write-remaining-chapters --yes`，最终提交
