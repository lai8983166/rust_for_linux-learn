## 1. 事实核实

- [x] 1.1 取 torvalds/linux master 的 `rust/kernel/lib.rs` 模块清单与 `error.rs` 全文，核实 Error/Result/to_result/code 常量的实际形态，记录检索日期
- [x] 1.2 取 `rust/kernel/types/`（opaque/refcount 等）核实 `Opaque`、`AlwaysRefCounted`、`ARef` 的定义与签名，验证示例代码中用法可溯源

## 2. 第一章：安全抽象的哲学

- [x] 2.1 实写 `docs/principles/safety-philosophy.md`：unsafe 三种角色、soundness、类型编码不变量、分层责任、微型完整包装例子（含 Rust/C 对照），验证无 TODO 残留、含版本锚定徽章
- [x] 2.2 提交（`docs: write principles chapter on safety abstraction philosophy`）

## 3. 第二章：kernel crate 结构图谱

- [x] 3.1 实写 `docs/principles/kernel-crate.md`：目录地图（Mermaid 分层图）、Opaque/AlwaysRefCounted/ARef 工具箱、bindings 分层、阅读路线，验证模块清单与 1.1 核实结果一致
- [x] 3.2 提交（`docs: write principles chapter on kernel crate map`）

## 4. 第三章：错误处理

- [x] 4.1 实写 `docs/principles/error-handling.md`：errno/ERR_PTR 惯用法与易错点、kernel::error 设计（对照 1.1 核实的事实）、C/Rust diff 对照、`?` 传播，验证代码示例可溯源
- [x] 4.2 提交（`docs: write principles chapter on error handling`）

## 5. 验证与归档

- [x] 5.1 `pnpm docs:build` 通过，抽查三章产物 HTML 含正文（无"内容撰写中"字样）与徽章
- [x] 5.2 核对本 change spec 四条要求（无 TODO、大纲全覆盖、API 可溯源、术语标注），勾完任务，`openspec archive write-principles-ch1-3 --yes`，最终提交
