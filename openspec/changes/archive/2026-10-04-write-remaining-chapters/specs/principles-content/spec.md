## ADDED Requirements

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
