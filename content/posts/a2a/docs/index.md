# Agent2Agent (A2A) 协议

Agent2Agent（A2A）协议是一个开放标准，用于实现 AI 代理之间的通信和协作。它提供了统一的通信语言，使不同框架和供应商构建的代理能够互操作。

## 核心特性

-   **互操作性** - 连接不同平台构建的代理（LangGraph、CrewAI、Semantic Kernel 等）
-   **复杂工作流** - 支持代理间任务委托、信息交换和行动协调
-   **安全通信** - 代理无需共享内部状态或工具即可协作
-   **标准化协议** - 基于 JSON-RPC 2.0 和 HTTP(S)的通信标准

## 技术架构

-   **传输协议** - JSON-RPC 2.0 over HTTP(S)（必需），gRPC over HTTP/2（可选）
-   **代理发现** - 通过 Agent Card 描述代理能力和连接信息
-   **交互模式** - 同步请求/响应、流式传输（SSE）、异步推送通知
-   **数据交换** - 支持文本、文件和结构化 JSON 数据
-   **安全机制** - 支持 API Key、OAuth 2.0、mTLS 等认证方式

## A2A 与 MCP 的关系

-   **MCP** - 连接代理到工具、API 和资源
-   **A2A** - 连接代理与代理进行协作通信

两者互补：代理使用 MCP 访问工具，使用 A2A 与其他代理协作。

## 快速开始

### 核心文档

-   [基础概念](./concepts) - A2A 协议基本概念和核心组件
-   [技术实现详解](./technical-implementation) - 任务生命周期、流式传输和代理发现
-   [协议规范](./specification) - 详细技术规范

### 教程和示例

-   [Python 教程](./tutorials/python/1-introduction) - 构建 A2A 代理的完整教程
-   [代码示例](https://github.com/a2aproject/a2a-samples) - 各种实现示例

### SDK 下载

-   [Python SDK](https://github.com/a2aproject/a2a-python) - `pip install a2a-sdk`
-   [JavaScript SDK](https://github.com/a2aproject/a2a-js) - `npm install @a2a-js/sdk`
-   [Java SDK](https://github.com/a2aproject/a2a-java) - Maven 依赖
-   [.NET SDK](https://github.com/a2aproject/a2a-dotnet) - `dotnet add package A2A`

### 高级主题

-   [企业级功能](./topics/enterprise-ready) - 安全性和可观察性
-   [A2A 与 MCP 关系](./topics/a2a-and-mcp) - 与模型上下文协议的互补关系
-   [扩展机制](./topics/extensions) - 协议扩展机制
-   [生态系统与发展](./ecosystem-and-development) - 社区、合作伙伴和发展路线图
