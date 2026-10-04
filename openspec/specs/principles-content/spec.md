# principles-content Specification

## Purpose
定义原理篇章节正文的内容契约：主题覆盖、示例要求、事实核实与版本锚定标准，保证教程"原理深挖"的核心质量承诺可被检验。

## Requirements

### Requirement: 章节正文覆盖拟定大纲的全部主题

每章正文 SHALL 覆盖该页占位阶段拟定大纲中的全部 H2 主题，不得留 TODO 残留； SHALL 保持"为什么这样设计"的叙述重心而非 API 罗列。

#### Scenario: 无 TODO 残留

- **WHEN** 检查已实写章节的 Markdown 源文件
- **THEN** 不含 "TODO" 标记与占位 info 容器

#### Scenario: 大纲主题全覆盖

- **WHEN** 将正文 H2 标题与该章拟定大纲对照
- **THEN** 每个拟定主题都在正文中有对应小节

### Requirement: API 事实锚定真实内核源码

章节中出现的内核 Rust API 名称、签名、模块路径 SHALL 与 torvalds/linux master 树（检索时点）实际源码一致；页内 SHALL 以 VersionBadge 标注锚定的源码树与检索日期。

#### Scenario: 代码示例可溯源

- **WHEN** 章节引用某 API（如 `Opaque`、`Error::to_result`）
- **THEN** 该名称与用法能在锚定的内核源码树中找到对应定义

### Requirement: 关键概念配有对照示例

每章 SHALL 至少包含一个 Rust/C 对照代码块（同一逻辑的双语言实现或 C 惯用法与 Rust 封装的对照），并在涉及分层结构时提供 Mermaid 图。

#### Scenario: 对照示例存在

- **WHEN** 阅读任一已实写章节
- **THEN** 至少一处以 rust 与 c（或 diff）两种语言标注呈现同一问题域的代码

### Requirement: 术语首次出现附英文

每章关键术语首次出现时 SHALL 使用 KernelTerm 组件或括注附英文原文，与附录术语表的译法保持一致。

#### Scenario: 术语标注一致

- **WHEN** 章节首次引入如 "soundness"、"guard" 等术语
- **THEN** 页面呈现中文术语与英文原文，且译法与术语表页一致

### Requirement: 教程全部章节实写完成

教程的全部 15 个页面 SHALL 为成文内容：正文覆盖拟定大纲全部主题，全站不存在"内容撰写中"占位容器与 TODO 标记。

#### Scenario: 全站无占位残留

- **WHEN** 检查 docs/ 下全部 Markdown 源文件
- **THEN** 无任何文件包含占位 info 容器或 "TODO" 标记

#### Scenario: 附录页可独立使用

- **WHEN** 读者不读正文、只打开附录页
- **THEN** 映射速查表与术语表足以当工具页使用，不依赖正文上下文

### Requirement: C↔Rust 映射速查表覆盖四大类别

`appendix/c-rust-mapping` SHALL 提供覆盖内存与分配、错误与控制流、同步与生命周期、设备与驱动四个类别的 C 惯用法到 Rust 对应物对照表，每类至少三条映射，且每条与正文章节实际讲授的 API 一致。

#### Scenario: 映射条目可溯源

- **WHEN** 抽查映射表中任一条目（如 kmalloc → KBox）
- **THEN** 对应 Rust API 在正文某章实际讲授过，且与锚定的内核源码树一致

### Requirement: 术语表覆盖正文全部 KernelTerm 术语

`appendix/glossary` SHALL 收录正文各章通过 KernelTerm 组件或括注标注的全部术语，每条含英文原文、推荐译法与一句解释，正文与术语表译法一致。

#### Scenario: 术语一一对应

- **WHEN** 汇总正文全部 KernelTerm 组件的 en 属性
- **THEN** 术语表中每个术语都有对应条目且译法一致

### Requirement: 参考文献按类别组织且链接有效

`appendix/references` SHALL 按官方文档、邮件列表与讨论、演讲与文章三类组织，条目为可访问的外部链接。

#### Scenario: 分类与链接

- **WHEN** 打开参考文献页
- **THEN** 三个分类下各有条目，链接目标为真实存在的官方或社区资源
