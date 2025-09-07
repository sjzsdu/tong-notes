---
title: "7. 流式传输和多轮交互（LangGraph示例）"
date: 2025-08-30T23:04:28+08:00
draft: false
description: "7. 流式传输和多轮交互（LangGraph示例）"
tags: 
  - "文档"
categories:
  - "技术"
---

# 7. 流式传输和多轮交互（LangGraph示例）

Helloworld示例演示了A2A的基本机制。对于更高级的功能，如强大的流式传输、任务状态管理和由LLM驱动的多轮对话，我们将转向位于[`a2a-samples/samples/python/agents/langgraph/`](https://github.com/a2aproject/a2a-samples/tree/main/samples/python/agents/langgraph)的LangGraph示例。

此示例展示了一个"货币代理"，它通过LangChain和LangGraph使用Gemini模型来回答货币转换问题。

## 设置LangGraph示例

1. 如果您还没有，请创建一个[Gemini API Key](https://ai.google.dev/gemini-api/docs/api-key)。

2. **环境变量：**

    在`a2a-samples/samples/python/agents/langgraph/`目录中创建`.env`文件：

    ```bash
    echo "GOOGLE_API_KEY=YOUR_API_KEY_HERE" > .env
    ```

    将`YOUR_API_KEY_HERE`替换为您的实际Gemini API密钥。

3. **安装依赖项（如果尚未覆盖）：**

    `langgraph`示例有自己的`pyproject.toml`，其中包括`langchain-google-genai`和`langgraph`等依赖项。当您使用`pip install -e .[dev]`从`a2a-samples`根目录安装SDK时，这也应该安装了工作区示例的依赖项，包括`langgraph-example`。如果遇到导入错误，请确保从根目录的主要SDK安装成功。

## 运行LangGraph服务器

在终端中导航到`a2a-samples/samples/python/agents/langgraph/app`目录，并确保您的虚拟环境（来自SDK根目录）已激活。

启动LangGraph代理服务器：

```bash
python __main__.py
```

这将启动服务器，通常在`http://localhost:10000`。

## 与LangGraph代理交互

打开一个**新的终端窗口**，激活您的虚拟环境，并导航到`a2a-samples/samples/python/agents/langgraph/app`。

运行其测试客户端：

```bash
python test_client.py
```

现在，您可以通过在运行`__main__.py`的终端窗口中键入Ctrl+C来关闭服务器。

## 演示的关键功能

`langgraph`示例展示了几个重要的A2A概念：

1. **LLM集成**：

    - `agent.py`定义了`CurrencyAgent`。它使用`ChatGoogleGenerativeAI`和LangGraph的`create_react_agent`来处理用户查询。
    - 这演示了真正的LLM如何驱动代理的逻辑。

2. **任务状态管理**：

    - `samples/langgraph/__main__.py`使用`InMemoryTaskStore`初始化`DefaultRequestHandler`。

        ```python { .no-copy }
        --8<-- "https://raw.githubusercontent.com/a2aproject/a2a-samples/refs/heads/main/samples/python/agents/langgraph/app/__main__.py:DefaultRequestHandler"
        ```

    - `CurrencyAgentExecutor`（在`samples/langgraph/agent_executor.py`中），当其`execute`方法被`DefaultRequestHandler`调用时，与包含当前任务（如果有）的`RequestContext`交互。
    - 对于`message/send`，`DefaultRequestHandler`使用`TaskStore`在交互中持久化和检索任务状态。如果代理的执行流程涉及多个步骤或导致持久任务，则对`message/send`的响应将是完整的`Task`对象。
    - `test_client.py`的`run_single_turn_test`演示了获取`Task`对象然后使用`get_task`查询它。

3. **使用`TaskStatusUpdateEvent`和`TaskArtifactUpdateEvent`的流式传输**：

    - `CurrencyAgentExecutor`中的`execute`方法负责处理非流式和流式请求，由`DefaultRequestHandler`编排。
    - 当LangGraph代理处理请求（可能涉及调用`get_exchange_rate`等工具）时，`CurrencyAgentExecutor`将不同类型的事件入队到`EventQueue`：
        - `TaskStatusUpdateEvent`：用于中间更新（例如，"查找汇率..."、"处理汇率..."）。这些事件的`final`标志是`False`。
        - `TaskArtifactUpdateEvent`：当最终答案准备就绪时，它作为工件入队。`lastChunk`标志是`True`。
        - 发送带有`state=TaskState.completed`和`final=True`的最终`TaskStatusUpdateEvent`以表示流式传输任务的结束。
    - `test_client.py`的`run_streaming_test`函数将在从服务器接收这些单独的事件块时打印它们。

4. **多轮对话（`TaskState.input_required`）**：

    - 如果查询模糊（例如，用户问"100美元是多少？"），`CurrencyAgent`可以要求澄清。
    - 当发生这种情况时，`CurrencyAgentExecutor`将入队一个`TaskStatusUpdateEvent`，其中`status.state`是`TaskState.input_required`，`status.message`包含代理的问题（例如，"您想要转换为哪种货币？"）。此事件对于当前交互流将具有`final=True`。
    - `test_client.py`的`run_multi_turn_test`函数演示了这一点：
        - 它发送初始模糊查询。
        - 代理响应（通过`DefaultRequestHandler`处理入队事件）一个状态为`input_required`的`Task`。
        - 然后客户端发送第二条消息，包括来自第一轮`Task`响应的`taskId`和`contextId`，以提供缺失信息（"以英镑计"）。这继续相同的任务。

## 探索代码

花一些时间查看这些文件：

- `__main__.py`：使用`A2AStarletteApplication`和`DefaultRequestHandler`的服务器设置。注意`AgentCard`定义包括`capabilities.streaming=True`。
- `agent.py`：带有LangGraph、LLM模型和工具定义的`CurrencyAgent`。
- `agent_executor.py`：实现`execute`（和`cancel`）方法的`CurrencyAgentExecutor`。它使用`RequestContext`来理解正在进行的任务，使用`EventQueue`发送回各种事件（`TaskStatusUpdateEvent`、`TaskArtifactUpdateEvent`，如果不存在任务，则通过第一个事件隐式发送新的`Task`对象）。
- `test_client.py`：演示各种交互模式，包括检索任务ID并将其用于多轮对话。

此示例提供了A2A如何促进复杂、有状态和异步代理交互的更丰富说明。