---
title: "下一步"
date: 2025-08-30T23:04:28+08:00
draft: false
description: "下一步"
tags: 
  - "文档"
categories:
  - "技术"
---

# 下一步

恭喜您完成了A2A Python SDK教程！您已经学会了如何：

- 为A2A开发设置您的环境。
- 使用SDK的类型定义代理技能和代理卡片。
- 实现基本的HelloWorld A2A服务器和客户端。
- 理解并实现流式传输功能。
- 使用LangGraph集成更复杂的代理，演示任务状态管理和工具使用。

您现在已经为构建和集成自己的A2A兼容代理奠定了坚实的基础。

## 接下来去哪里？

以下是一些继续您的A2A之旅的想法和资源：

- **探索其他示例：**
    - 查看[A2A GitHub仓库](https://github.com/a2aproject/a2a-samples/tree/main/samples)中`a2a-samples/samples/`目录中的其他示例，了解更复杂的代理集成和功能。
    - 主要的A2A仓库还有[其他语言和框架的示例](https://github.com/a2aproject/A2A/tree/main/samples)。
- **加深您的协议理解：**
    - 📚 阅读完整的[A2A协议文档网站](https://google.github.io/A2A/)以获得全面概述。
    - 📝 查看详细的[A2A协议规范](../../specification.md)以了解所有数据结构和RPC方法的细节。
- **查看关键A2A主题：**
    - [A2A和MCP](../../topics/a2a-and-mcp.md)：了解A2A如何补充模型上下文协议用于工具使用。
    - [企业级功能](../../topics/enterprise-ready.md)：了解安全性、可观察性和其他企业考虑因素。
    - [流式传输和异步操作](../../topics/streaming-and-async.md)：获取有关SSE和推送通知的更多详细信息。
    - [代理发现](../../topics/agent-discovery.md)：探索代理相互发现的不同方式。
- **构建您自己的代理：**
    - 尝试使用您最喜欢的Python代理框架（如LangChain、CrewAI、AutoGen、Semantic Kernel或自定义解决方案）创建新的A2A代理。
    - 实现`a2a.server.AgentExecutor`接口，以将您代理的逻辑与A2A协议桥接。
    - 思考您的代理可以提供哪些独特技能以及其代理卡片如何表示它们。
- **实验高级功能：**
    - 如果您的代理处理长时间运行或多会话任务，请使用持久`TaskStore`实现强大的任务管理。
    - 如果您的代理任务生命周期很长，请探索实现推送通知。
    - 考虑更复杂的输入和输出模式（例如，处理文件上传/下载，或通过`DataPart`处理结构化数据）。
- **为A2A社区贡献：**
    - 加入[A2A GitHub讨论页面](https://github.com/a2aproject/A2A/discussions)上的讨论。
    - 通过[GitHub Issues](https://github.com/a2aproject/A2A/issues)报告问题或提出改进建议。
    - 考虑贡献代码、示例或文档。请参阅[CONTRIBUTING.md](https://github.com/a2aproject/A2A/blob/main/CONTRIBUTING.md)指南。

A2A协议旨在培养可互操作的AI代理生态系统。通过构建和共享A2A兼容代理，您可以成为这一激动人心的发展的一部分！