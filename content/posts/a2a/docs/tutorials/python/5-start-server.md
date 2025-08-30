# 5. 启动服务器

现在我们有了代理卡片和代理执行器，我们可以设置并启动A2A服务器。

A2A Python SDK提供了`A2AStarletteApplication`类，简化了运行A2A兼容HTTP服务器的过程。它使用[Starlette](https://www.starlette.io/)作为Web框架，通常与[Uvicorn](https://www.uvicorn.org/)等ASGI服务器一起运行。

## Helloworld中的服务器设置

让我们再次查看`__main__.py`，看看服务器是如何初始化和启动的。

```python { .no-copy }
--8<-- "https://raw.githubusercontent.com/a2aproject/a2a-samples/refs/heads/main/samples/python/agents/helloworld/__main__.py"
```

让我们分解一下：

1. **`DefaultRequestHandler`**：

    - SDK提供`DefaultRequestHandler`。这个处理器接受您的`AgentExecutor`实现（这里是`HelloWorldAgentExecutor`）和一个`TaskStore`（这里是`InMemoryTaskStore`）。
    - 它将传入的A2A RPC调用路由到您执行器上的适当方法（如`execute`或`cancel`）。
    - `TaskStore`由`DefaultRequestHandler`用于管理任务的生命周期，特别是对于有状态交互、流式传输和重新订阅。即使您的代理执行器很简单，处理器也需要任务存储。

2. **`A2AStarletteApplication`**：

    - `A2AStarletteApplication`类使用`agent_card`和`request_handler`（在其构造函数中称为`http_handler`）实例化。
    - `agent_card`至关重要，因为服务器将在`/.well-known/agent-card.json`端点（默认情况下）暴露它。
    - `request_handler`负责通过与您的`AgentExecutor`交互来处理所有传入的A2A方法调用。

3. **`uvicorn.run(server_app_builder.build(), ...)`**：
    - `A2AStarletteApplication`有一个`build()`方法来构造实际的Starlette应用程序。
    - 然后使用`uvicorn.run()`运行此应用程序，使您的代理可通过HTTP访问。
    - `host='0.0.0.0'`使服务器在您机器上的所有网络接口上可访问。
    - `port=9999`指定要监听的端口。这与`AgentCard`中的`url`匹配。

## 运行Helloworld服务器

在终端中导航到`a2a-samples`目录（如果您还没有在那里）并确保您的虚拟环境已激活。

要运行Helloworld服务器：

```bash
# 从a2a-samples目录
python samples/python/agents/helloworld/__main__.py
```

您应该看到类似这样的输出，表明服务器正在运行：

```console { .no-copy }
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:9999 (Press CTRL+C to quit)
```

您的A2A Helloworld代理现在已上线并正在侦听请求！在下一步中，我们将与它交互。