---
title: "4. 代理执行器"
date: 2025-08-30T23:04:28+08:00
draft: false
description: "4. 代理执行器"
tags: 
  - "文档"
categories:
  - "技术"
---

# 4. 代理执行器

A2A代理如何处理请求并生成响应/事件的核心逻辑由**代理执行器**处理。A2A Python SDK提供了抽象基类`a2a.server.agent_execution.AgentExecutor`供您实现。

## `AgentExecutor`接口

`AgentExecutor`类定义了两个主要方法：

- `async def execute(self, context: RequestContext, event_queue: EventQueue)`：处理期望响应或事件流的传入请求。它处理用户的输入（通过`context`可用）并使用`event_queue`发送回`Message`、`Task`、`TaskStatusUpdateEvent`或`TaskArtifactUpdateEvent`对象。
- `async def cancel(self, context: RequestContext, event_queue: EventQueue)`：处理取消正在进行任务的请求。

`RequestContext`提供有关传入请求的信息，例如用户的消息和任何现有任务详细信息。`EventQueue`由执行器用于将事件发送回客户端。

## Helloworld代理执行器

让我们看看`agent_executor.py`。它定义了`HelloWorldAgentExecutor`。

1. **代理（`HelloWorldAgent`）**：
    这是一个简单的辅助类，封装了实际的"业务逻辑"。

    ```python { .no-copy }
    --8<-- "https://raw.githubusercontent.com/a2aproject/a2a-samples/refs/heads/main/samples/python/agents/helloworld/agent_executor.py:HelloWorldAgent"
    ```

    它有一个简单的`invoke`方法，返回字符串"Hello World"。

2. **执行器（`HelloWorldAgentExecutor`）**：
    这个类实现了`AgentExecutor`接口。

    - **`__init__`**：

        ```python { .no-copy }
        --8<-- "https://raw.githubusercontent.com/a2aproject/a2a-samples/refs/heads/main/samples/python/agents/helloworld/agent_executor.py:HelloWorldAgentExecutor_init"
        ```

        它实例化`HelloWorldAgent`。

    - **`execute`**：

        ```python { .no-copy }
        --8<-- "https://raw.githubusercontent.com/a2aproject/a2a-samples/refs/heads/main/samples/python/agents/helloworld/agent_executor.py:HelloWorldAgentExecutor_execute"
        ```

        当`message/send`或`message/stream`请求传入时（在这个简化的执行器中，两者都由`execute`处理）：

        1. 它调用`self.agent.invoke()`获取"Hello World"字符串。
        2. 它使用`new_agent_text_message`实用函数创建A2A `Message`对象。
        3. 它将此消息入队到`event_queue`中。底层的`DefaultRequestHandler`然后将处理此队列以将响应发送给客户端。对于像这样的单个消息，它将为`message/send`产生单个响应，或为`message/stream`产生单个事件，然后流关闭。

    - **`cancel`**：
        Helloworld示例的`cancel`方法只是抛出异常，表示此基本代理不支持取消。

        ```python { .no-copy }
        --8<-- "https://raw.githubusercontent.com/a2aproject/a2a-samples/refs/heads/main/samples/python/agents/helloworld/agent_executor.py:HelloWorldAgentExecutor_cancel"
        ```

`AgentExecutor`充当A2A协议（由请求处理器和服务器应用程序管理）与您代理的特定逻辑之间的桥梁。它接收有关请求的上下文，并使用事件队列将结果或更新传达回去。