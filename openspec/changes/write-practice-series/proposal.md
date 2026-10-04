# write-practice-series

## Why

原理篇九章已交付（归档 `2026-10-04-write-principles-ch1-3`、`write-remaining-chapters`），读者具备了概念地图但缺少"亲手写"的路径。教程规划的下一步（展望章已预告）是实战篇：从零写一个字符设备驱动的连载，把原理篇的概念落成可运行、可加载、可调试的真实模块。

## What Changes

- 新增"实战篇"6 页（`docs/practice/`）：
  - `overview.md`：导览——目标成果物（一个 misc 字符设备 + ioctl），路线图，环境回顾
  - `first-module.md`：第一个模块——module 宏、构建与加载、日志
  - `misc-device.md`：misc 字符设备——注册、open/read/write 最小回环
  - `state-and-sync.md`：状态与并发——SpinLock/KVec 环形缓冲、读写语义
  - `ioctl-uaccess.md`：ioctl 与用户内存——命令编码、UserSlice 双向拷贝
  - `debug-wrapup.md`：调试、测试与收尾——日志等级、故障排查、KUnit 概览、下一步
- 站点导航：侧边栏新增"实战篇"分组（位于原理篇之后），顶部导航加入口；总页数 15 → 21
- 代码事实对照 master 树核实（samples/rust 现状、miscdevice.rs、uaccess.rs）

## Capabilities

### New Capabilities

- `practice-content`: 实战篇章节的内容契约——连载式递进结构（每章产出的代码是下一章的起点）、代码必须锚定真实源码、可跟做性（每步操作可验证）

### Modified Capabilities

- `tutorial-site`: 侧边栏分组从三组 15 页扩展为四组 21 页（新增"实战篇"6 页，位于原理篇与展望之间），导航含实战篇入口

## Impact

- 新增 `docs/practice/` 目录 6 文件；修改 `docs/.vitepress/config.mts`
- `tutorial-site` 与 `principles-content` 主 spec 由本 change 的 delta 扩充
- 不改主题、组件、既有页面内容
