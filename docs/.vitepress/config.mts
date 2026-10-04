import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    lang: 'zh-CN',
    title: 'Rust for Linux 中文教程',
    description:
      '深入解读 Linux 内核中的 Rust 支持：安全抽象的哲学、kernel crate 架构、pinning 与就地初始化、错误处理与内存分配、构建系统与 C 互操作。',
    lastUpdated: true,
    mermaid: {
      // 亮色主题；暗色模式由插件随站点外观自动切换
      theme: 'default',
    },
    themeConfig: {
      nav: [
        { text: '开始', link: '/intro/why-rust' },
        { text: '原理篇', link: '/principles/safety-philosophy' },
        { text: '附录', link: '/appendix/c-rust-mapping' },
        {
          text: '官方文档',
          items: [
            { text: '内核 Rust 文档 (kernel.org)', link: 'https://docs.kernel.org/next/rust/' },
            { text: 'rust-for-linux 项目', link: 'https://rust-for-linux.com/' },
          ],
        },
      ],
      sidebar: [
        {
          text: '开始',
          collapsed: false,
          items: [
            { text: '引子：内核为什么引入 Rust', link: '/intro/why-rust' },
            { text: '快速上手：最小可运行环境', link: '/quick-start/environment' },
          ],
        },
        {
          text: '原理篇',
          collapsed: false,
          items: [
            { text: '安全抽象的哲学', link: '/principles/safety-philosophy' },
            { text: 'kernel crate 结构图谱', link: '/principles/kernel-crate' },
            { text: '错误处理：Result 与 errno', link: '/principles/error-handling' },
            { text: '内存分配：KBox/KVec 与 GFP', link: '/principles/allocation' },
            { text: 'Pinning 与就地初始化', link: '/principles/pinning-init' },
            { text: '为什么用 unstable 特性', link: '/principles/unstable-features' },
            { text: '同步原语的 RAII 封装', link: '/principles/synchronization' },
            { text: '设备模型与驱动抽象', link: '/principles/device-model' },
            { text: '构建系统：Kbuild 与 bindgen', link: '/principles/build-system' },
          ],
        },
        {
          text: '展望与附录',
          collapsed: true,
          items: [
            { text: '展望与学习路线', link: '/outlook/future' },
            { text: 'C↔Rust 映射速查表', link: '/appendix/c-rust-mapping' },
            { text: '中英术语表', link: '/appendix/glossary' },
            { text: '参考文献', link: '/appendix/references' },
          ],
        },
      ],
      outline: { level: [2, 3], label: '本页内容' },
      docFooter: { prev: '上一篇', next: '下一篇' },
      lastUpdated: { text: '最后更新' },
      returnToTopLabel: '回到顶部',
      externalLinkIcon: true,
      search: {
        provider: 'local',
        options: {
          translations: {
            button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
            modal: {
              noResultsText: '未找到相关结果',
              resetButtonTitle: '清除查询条件',
              displayDetails: '显示详细列表',
              footer: {
                selectText: '选择',
                navigateText: '切换',
                closeText: '关闭',
              },
            },
          },
          miniSearch: {
            options: {
              // MiniSearch 默认按空白分词，中文整段会变成单个 token，
              // 用 Intl.Segmenter 按词切分才能让中文搜索真正可用
              tokenize: (text: string) =>
                [...new Intl.Segmenter('zh-CN', { granularity: 'word' }).segment(text)].map(
                  (s) => s.segment,
                ),
            },
            searchOptions: {
              fuzzy: 0.2,
              prefix: true,
              boost: { title: 4, text: 2, titles: 1 },
            },
          },
        },
      },
    },
  }),
)
