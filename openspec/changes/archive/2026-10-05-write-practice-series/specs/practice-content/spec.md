## Purpose

定义实战篇连载的内容契约：递进式跟做结构、代码锚定真实内核源码、每步操作可验证，保证"从零写一个字符设备驱动"的承诺可被检验。

## ADDED Requirements

### Requirement: 实战篇以递进连载组织

实战篇 SHALL 按连载递进组织：每章产出的代码是下一章的直接起点，最终章完成时读者手中 SHALL 有一个具备 open/read/write/ioctl 完整功能的字符设备驱动。每章 SHALL 说明本章在成果物上新增了什么。

#### Scenario: 章间代码衔接

- **WHEN** 阅读第 N 章末尾与第 N+1 章开头的代码
- **THEN** 第 N+1 章以第 N 章的最终代码为起点描述增量

#### Scenario: 成果物完整

- **WHEN** 读者完成全部六章
- **THEN** 手中代码构成一个可编译加载、支持 open/read/write/ioctl 的完整字符设备驱动

### Requirement: 实战代码锚定真实源码与示例

实战篇出现的内核 API（模块注册、misc 设备注册、文件操作 trait、用户内存访问）SHALL 与 torvalds/linux master 树的实际形态一致； SHALL 优先对照 `samples/rust/` 官方示例交叉印证；页内 SHALL 标注版本锚定徽章。

#### Scenario: 跟做代码可溯源

- **WHEN** 抽查实战篇任一代码块中的 API（如 misc 设备注册、UserSlice 用法）
- **THEN** 该 API 形态能在锚定源码树或官方 samples 中找到对应

### Requirement: 每一步操作附验证方法

实战篇每个操作步骤（构建、加载、测试）SHALL 附带可执行的验证方法（命令与预期输出），失败时 SHALL 提供排查方向。

#### Scenario: 跟做可自查

- **WHEN** 读者按某步骤操作
- **THEN** 文中给出的验证命令与预期输出可用于判断该步是否成功
