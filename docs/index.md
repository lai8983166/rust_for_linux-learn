---
layout: home

hero:
  name: Rust for Linux
  text: 中文图文教程
  tagline: 原理深挖 —— 安全抽象、kernel crate 与 C 互操作
  actions:
    - theme: brand
      text: 从引子开始
      link: /intro/why-rust
    - theme: alt
      text: 快速上手
      link: /quick-start/environment

features:
  - icon: 🧭
    title: 原理深挖
    details: 不止于"能跑通"：安全抽象如何设计、为什么内核需要 pinning、Kbuild 与 bindgen 如何协作——讲清楚每一个设计背后的"为什么"。
  - icon: 📌
    title: 版本锚定
    details: 内核 Rust API 演进极快，本教程每个涉及实操的页面都标注撰写时锚定的内核与工具链版本，过时内容一眼可辨。
  - icon: 🇨🇳
    title: 中文叙述 + 术语对照
    details: 全中文行文，关键术语首次出现时附英文原文与社区惯用译法，附完整中英术语表。
  - icon: 📊
    title: 图文并茂
    details: 时间线、架构图、数据流图以 Mermaid 呈现，源码用 Rust / C 双栏对照，命令块标注语言与预期输出。
---
