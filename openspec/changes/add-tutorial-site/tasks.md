## 1. 脚手架

- [x] 1.1 写入 `.npmrc`（shamefully-hoist=true）、`package.json`（docs:dev/build/preview scripts）、`.gitignore`（node_modules、docs/.vitepress/dist、cache），验证三个文件存在且内容正确
- [x] 1.2 运行 `pnpm add -D vitepress@^1.6.4 vitepress-plugin-mermaid@^2.0.17 mermaid@^11`，验证安装无 peer 冲突、`pnpm-lock.yaml` 生成
- [x] 1.3 `git init` 并完成首次提交（`chore: init project scaffold`，含 openspec 变更目录），验证 `git log` 有一条提交

## 2. 站点配置与主题

- [x] 2.1 写 `docs/.vitepress/config.mts`：withMermaid 包裹、lang zh-CN、三组侧边栏（15 页）、本地搜索（中文翻译 + Intl.Segmenter 分词）、lastUpdated，验证 TypeScript 语法无误
- [x] 2.2 写 `docs/.vitepress/theme/`（index.ts 注册组件、style.css、VersionBadge.vue、KernelTerm.vue），验证四个文件存在且组件 props 定义完整
- [x] 2.3 提交（`feat: add vitepress config, theme and components`），验证 `git log` 新增一条

## 3. 实写内容页（3 页）

- [x] 3.1 写 `docs/index.md`（hero + 特性卡片 + 行动按钮指向引子/快速上手），验证 frontmatter 合法
- [x] 3.2 写 `docs/intro/why-rust.md`（动机、mermaid 时间线、现状、争议、本教程路线），验证含至少一个 mermaid 代码块
- [x] 3.3 写 `docs/quick-start/environment.md`（顶部 VersionBadge、rustup/bindgen/LLVM 工具链步骤、CONFIG_RUST、QEMU/virtme-ng 验证、Ubuntu 版本化包注意），验证所有命令块使用 console/bash/ini 语言标注
- [x] 3.4 提交（`docs: write home, intro and quick-start pages`），验证 `git log` 新增一条

## 4. 占位章节（12 页）

- [x] 4.1 写 principles 9 页（safety-philosophy、kernel-crate、error-handling、allocation、pinning-init、unstable-features、synchronization、device-model、build-system），每页含 frontmatter title、info 占位容器、H2 大纲，验证零内部链接
- [x] 4.2 写 outlook/future + appendix 3 页（c-rust-mapping、glossary、references），同上格式，验证零内部链接
- [x] 4.3 提交（`docs: add chapter stubs for principles, outlook and appendix`），验证 `git log` 新增一条

## 5. 验证与收尾

- [x] 5.1 运行 `pnpm docs:build`，验证构建成功、无死链错误、dist 含 16 个页面 HTML（首页 + 15 章）
- [x] 5.2 启动 `pnpm docs:dev` 验证无插件报错后停止；`pnpm docs:preview` + curl 抽查引子页含标题与 mermaid 容器
- [x] 5.3 提交后重建，验证 lastUpdated 日期出现
- [x] 5.4 核对 spec 场景逐条满足（中文搜索界面、侧边栏分组、版本徽章、暗色模式、占位声明），完成最终提交
