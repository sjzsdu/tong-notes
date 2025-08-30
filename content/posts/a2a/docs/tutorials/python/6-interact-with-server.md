# 6. 与服务器交互

在Helloworld A2A服务器运行时，让我们向它发送一些请求。SDK包含一个客户端（`A2AClient`），简化了这些交互。

## Helloworld测试客户端

`test_client.py`脚本演示了如何：

1. 从服务器获取代理卡片。
2. 创建`A2AClient`实例。
3. 发送非流式（`message/send`）和流式（`message/stream`）请求。

打开一个**新的终端窗口**，激活您的虚拟环境，并导航到`a2a-samples`目录。

激活虚拟环境（确保在创建虚拟环境的同一目录中执行此操作）：

=== "Mac/Linux"

    ```sh
    source .venv/bin/activate
    ```

=== "Windows"

    ```powershell
    .venv\Scripts\activate
    ```

运行测试客户端：

```bash
# 从a2a-samples目录
python samples/python/agents/helloworld/test_client.py
```

## 理解客户端代码

让我们看看`test_client.py`的关键部分：

1. **获取代理卡片和初始化客户端**：

    ```python { .no-copy }
    --8<-- "https://raw.githubusercontent.com/a2aproject/a2a-samples/refs/heads/main/samples/python/agents/helloworld/test_client.py:A2ACardResolver"
    ```

    `A2ACardResolver`类是一个便利类。它首先从服务器的`/.well-known/agent-card.json`端点（基于提供的基本URL）获取`AgentCard`，然后用它初始化客户端。

2. **发送非流式消息（`send_message`）**：

    ```python { .no-copy }
    --8<-- "https://raw.githubusercontent.com/a2aproject/a2a-samples/refs/heads/main/samples/python/agents/helloworld/test_client.py:send_message"
    ```

    - `send_message_payload`构造`MessageSendParams`的数据。
    - 这被包装在`SendMessageRequest`中。
    - 它包括一个`message`对象，`role`设置为"user"，内容在`parts`中。
    - Helloworld代理的`execute`方法将入队一个"Hello World"消息。`DefaultRequestHandler`将检索此消息并将其作为响应发送。
    - `response`将是一个`SendMessageResponse`对象，它包含`SendMessageSuccessResponse`（以代理的`Message`作为结果）或`JSONRPCErrorResponse`。

3. **处理任务ID（Helloworld的说明性注释）**：

    Helloworld客户端（`test_client.py`）不直接尝试`get_task`或`cancel_task`，因为简单的Helloworld代理的`execute`方法，当通过`message/send`调用时，导致`DefaultRequestHandler`返回直接的`Message`响应而不是`Task`对象。更复杂的代理（如LangGraph示例）明确管理任务，会从`message/send`返回`Task`对象，然后其`id`可以用于`get_task`或`cancel_task`。

4. **发送流式消息（`send_message_streaming`）**：

    ```python { .no-copy }
    --8<-- "https://raw.githubusercontent.com/a2aproject/a2a-samples/refs/heads/main/samples/python/agents/helloworld/test_client.py:send_message_streaming"
    ```

    - 此方法调用代理的`message/stream`端点。`DefaultRequestHandler`将调用`HelloWorldAgentExecutor.execute`方法。
    - `execute`方法入队一个"Hello World"消息，然后事件队列关闭。
    - 客户端将接收此单个消息作为一个`SendStreamingMessageResponse`事件，然后流终止。
    - `stream_response`是`AsyncGenerator`。

## 预期输出

当您运行`test_client.py`时，您将看到以下的JSON输出：

- 非流式响应（单个"Hello World"消息）。
- 流式响应（作为一个块的单个"Hello World"消息，之后流结束）。

输出中的`id`字段将因每次运行而异。

```console { .no-copy }
// 非流式响应
{"jsonrpc":"2.0","id":"xxxxxxxx","result":{"type":"message","role":"agent","parts":[{"type":"text","text":"Hello World"}],"messageId":"yyyyyyyy"}}
// 流式响应（一个块）
{"jsonrpc":"2.0","id":"zzzzzzzz","result":{"type":"message","role":"agent","parts":[{"type":"text","text":"Hello World"}],"messageId":"wwwwwwww","final":true}}
```

_（实际的ID如`xxxxxxxx`、`yyyyyyyy`、`zzzzzzzz`、`wwwwwwww`将是不同的UUID/请求ID）_

这确认您的服务器正在使用更新的SDK结构正确处理基本的A2A交互！

现在您可以通过在运行`__main__.py`的终端窗口中键入Ctrl+C来关闭服务器。