---
title: "LangChainGo 文档导航"
date: "2023-10-15"
lastmod: "2023-10-15"
draft: false
author: "孙巨中"
description: "LangChainGo框架文档导航页，提供各模块文档的简短介绍和链接"
keywords: ["LangChainGo", "Go语言", "LLM框架", "大语言模型", "文档导航"]
tags: ["架构设计", "Go语言", "LLM应用", "系统分析", "接口设计", "模块化架构", "AI框架"]
categories: ["ai", "langchaingo"]
weight: 8000
showInHome: true
license: "CC BY-NC-ND"
featured_image: ""
summary: "LangChainGo是LangChain的Go语言实现，本文提供了框架各模块文档的导航索引，包括架构分析、LLMs、代理、链、向量存储等核心组件的详细文档链接。"
---

# LangChainGo 文档导航

## 框架概述

LangChainGo 是 LangChain 的 Go 语言实现，它是一个用于构建基于大型语言模型（LLMs）应用的框架。该框架通过组合性使开发者能够创建强大的 AI 驱动应用，提供了与各种 LLM 提供商、向量数据库和其他 AI 服务的统一接口。

## 核心文档

- [框架架构分析](structure) - 深入分析LangChainGo框架架构，包括核心组件、接口设计、模块化结构和工作流程
- [使用指南](demo) - LangChainGo的详细使用指南，包括安装、核心概念和基本用法

## 模块文档

### LLMs

- [LLMs包详解](llms) - 深入分析LangChainGo框架中LLMs包的结构、接口设计和使用模式
- [LLMs子模块](llms/) - LLMs相关子模块文档
  - [Anthropic集成](llms/anthropic) - Anthropic模型集成文档
  - [LLMs类图](llms/llms_class_diagram) - LLMs模块类图分析
  - [API分析](llms/llms_exposed_api_analysis) - LLMs暴露的API分析
  - [工作流程](llms/llms_flow) - LLMs模块工作流程
  - [消息流程](llms/llms_message_flow) - LLMs消息处理流程
  - [包分析](llms/llms_package_analysis) - LLMs包结构分析

### 代理系统

- [代理模块](agents/agents) - LangChainGo代理系统分析，包括接口设计和执行流程
- [代理示例](agents/agent-demo) - 代理系统使用示例
- [工具集成](agents/tools) - 代理工具集成文档

### 链式处理

- [链概述](chains/chains) - 链式处理模块概述和接口设计
- [链示例](chains/chains_examples) - 链式处理使用示例

### 其他核心组件

- [回调系统](callbacks) - 回调系统设计和使用方法
- [嵌入向量](embeddings) - 嵌入向量模块文档
- [内存管理](memory) - 对话历史和内存管理
- [解析器](parser) - 输出解析器文档
- [提示模板](prompts) - 提示模板系统文档
- [数据模式](schema) - 核心数据模式定义
- [向量存储](vectorstores) - 向量存储集成文档

## 使用建议

1. 新用户建议先阅读[使用指南](demo)和[框架架构分析](structure)，了解框架的基本概念和使用方法
2. 根据具体需求，深入研究相关模块的文档
3. 参考示例文档，快速上手开发

## 贡献

LangChainGo 是一个开源项目，欢迎贡献代码和文档。请访问[GitHub仓库](https://github.com/tmc/langchaingo)了解更多信息。