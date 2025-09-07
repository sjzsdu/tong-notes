---
title: "3. 代理技能和代理卡片"
date: 2025-08-30T23:04:28+08:00
draft: false
description: "3. 代理技能和代理卡片"
tags: 
  - "文档"
categories:
  - "技术"
---

# 3. 代理技能和代理卡片

在A2A代理能够做任何事情之前，它需要定义它_能够_做什么（它的技能）以及其他代理或客户端如何了解这些能力（它的代理卡片）。

我们将使用位于[`a2a-samples/samples/python/agents/helloworld/`](https://github.com/a2aproject/a2a-samples/tree/main/samples/python/agents/helloworld)的`helloworld`示例。

## 代理技能

**代理技能**描述代理可以执行的特定能力或功能。它是一个构建块，告诉客户端代理适合哪种类型的任务。

`AgentSkill`的关键属性（在`a2a.types`中定义）：

- `id`：技能的唯一标识符。
- `name`：人类可读的名称。
- `description`：技能功能的更详细解释。
- `tags`：用于分类和发现的关键词。
- `examples`：示例提示或用例。
- `inputModes` / `outputModes`：支持的输入和输出媒体类型（例如，"text/plain"、"application/json"）。

在`__main__.py`中，您可以看到如何为Helloworld代理定义技能：

```python { .no-copy }
--8<-- "https://raw.githubusercontent.com/a2aproject/a2a-samples/refs/heads/main/samples/python/agents/helloworld/__main__.py:AgentSkill"
```

这个技能非常简单：它被命名为"Returns hello world"，主要处理文本。

## 代理卡片

**代理卡片**是A2A服务器提供的JSON文档，通常在`.well-known/agent-card.json`端点可用。它就像代理的数字名片。

`AgentCard`的关键属性（在`a2a.types`中定义）：

- `name`、`description`、`version`：基本身份信息。
- `url`：可以到达A2A服务的端点。
- `capabilities`：指定支持的A2A功能，如`streaming`或`pushNotifications`。
- `defaultInputModes` / `defaultOutputModes`：代理的默认媒体类型。
- `skills`：代理提供的`AgentSkill`对象列表。

`helloworld`示例这样定义其代理卡片：

```python { .no-copy }
--8<-- "https://raw.githubusercontent.com/a2aproject/a2a-samples/refs/heads/main/samples/python/agents/helloworld/__main__.py:AgentCard"
```

这张卡片告诉我们代理名为"Hello World Agent"，运行在`http://localhost:9999/`，支持文本交互，并具有`hello_world`技能。它还表示公共身份验证，意味着不需要特定凭据。

理解代理卡片至关重要，因为这是客户端发现代理并学习如何与其交互的方式。