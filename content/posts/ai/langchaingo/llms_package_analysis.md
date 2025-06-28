---
title: "LangChainGo llms包全面分析"
date: "2025-06-26"
lastmod: "2025-06-26"
draft: false
author: "孙巨中"
description: "深入分析LangChainGo的llms包架构，包括核心接口、消息处理、工具调用、流式响应和缓存机制等核心流程，展示其作为构建LLM应用的Go语言框架的优势"
keywords: ["LangChainGo", "Go语言", "LLM框架", "大语言模型", "llms包", "API设计", "流程分析", "泳道图"]
tags: ["架构设计", "Go语言", "LLM应用", "系统分析", "接口设计", "模块化架构", "AI框架"]
categories: ["系统架构", "人工智能", "编程语言"]
weight: 8001
showInHome: true
license: "CC BY-NC-ND"
featured_image: ""
summary: "本文通过泳道图全面分析LangChainGo的llms包，包括核心接口与结构、基本调用流程、消息处理、工具调用、流式响应、缓存机制等，帮助理解其工作原理。"
---
# LangChainGo llms 包全面分析

本文档提供了 LangChainGo 中 llms 包的全面分析，通过泳道图展示了各个核心流程，帮助理解其工作原理。

## 目录

1. [核心接口与结构](#核心接口与结构)
2. [基本调用流程](#基本调用流程)
3. [消息处理流程](#消息处理流程)
4. [工具调用流程](#工具调用流程)
5. [流式响应处理流程](#流式响应处理流程)
6. [缓存机制流程](#缓存机制流程)
7. [错误处理流程](#错误处理流程)
8. [中间件模式流程](#中间件模式流程)
9. [令牌计数流程](#令牌计数流程)
10. [回调处理流程](#回调处理流程)
11. [提供商实现流程](#提供商实现流程)
12. [总结与最佳实践](#总结与最佳实践)

## 核心接口与结构

llms 包对外暴露的主要内容包括：

1. **Model 接口**：所有 LLM 提供商必须实现的核心接口
   - `GenerateContent(ctx, messages, options)` - 主要方法，生成内容
   - `Call(ctx, prompt, options)` - 简化方法，已弃用

2. **MessageContent**：消息内容结构体
   - `Role` - 消息角色（人类、AI、系统等）
   - `Parts` - 内容部分的切片

3. **ContentPart**：内容部分接口，有多种实现
   - `TextContent` - 文本内容
   - `ImageURLContent` - 图像URL内容
   - `BinaryContent` - 二进制数据内容
   - `ToolCall` - 工具调用
   - `ToolCallResponse` - 工具调用响应

4. **CallOptions**：调用选项，用于配置 LLM 调用的参数
   - 模型参数（温度、最大令牌数等）
   - 流式处理函数
   - 工具和函数定义

5. **ChatMessage**：聊天消息接口，有多种实现
   - `AIChatMessage` - AI消息
   - `HumanChatMessage` - 人类消息
   - `SystemChatMessage` - 系统消息
   - `GenericChatMessage` - 通用消息
   - `FunctionChatMessage` - 函数消息
   - `ToolChatMessage` - 工具消息

6. **Tool 和 ToolCall**：工具和工具调用相关结构体
   - `Tool` - 工具定义
   - `FunctionDefinition` - 函数定义
   - `ToolCall` - 工具调用
   - `FunctionCall` - 函数调用

7. **ContentResponse**：LLM 响应结构体
   - `Choices` - 响应选项数组
   - 每个 Choice 包含内容、停止原因、生成信息等

## 基本调用流程

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant Model as llms.Model接口
    participant Provider as 具体LLM提供商实现
    participant Cache as 缓存层(可选)
    participant API as 外部LLM API
    
    App->>Model: GenerateContent(ctx, messages, options)
    
    alt 使用缓存
        Model->>Cache: 检查缓存
        Cache-->>Model: 返回缓存结果(如果存在)
    end
    
    Model->>Provider: 调用具体提供商实现
    Provider->>Provider: 转换消息格式
    Provider->>Provider: 应用调用选项
    Provider->>API: 发送API请求
    API-->>Provider: 返回响应
    Provider->>Provider: 转换响应格式
    Provider-->>Model: 返回ContentResponse
    
    alt 使用缓存
        Model->>Cache: 存储结果到缓存
    end
    
    Model-->>App: 返回ContentResponse
```

## 消息处理流程

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant MessageContent as llms.MessageContent
    participant ContentPart as llms.ContentPart
    participant Model as llms.Model
    participant Provider as 具体LLM提供商
    participant ProviderMsg as 提供商特定消息格式
    participant API as 外部LLM API
    
    App->>MessageContent: 创建消息(Role, Parts)
    App->>ContentPart: 创建TextPart("文本内容")
    ContentPart-->>MessageContent: 添加文本部分
    App->>ContentPart: 创建ImageURLPart("图片URL")
    ContentPart-->>MessageContent: 添加图片部分
    
    App->>Model: GenerateContent(ctx, messages, options)
    Model->>Provider: 转发请求
    
    Provider->>Provider: 检查提供商能力
    Provider->>ProviderMsg: 转换MessageContent
    Provider->>ProviderMsg: 转换ContentPart
    
    loop 对每个消息
        Provider->>ProviderMsg: 设置角色(system/user/assistant)
        
        loop 对每个内容部分
            alt 文本内容
                Provider->>ProviderMsg: 添加文本内容
            else 图片URL内容
                Provider->>ProviderMsg: 添加图片URL内容
            else 二进制内容
                Provider->>ProviderMsg: 添加二进制内容并编码
            else 工具调用
                Provider->>ProviderMsg: 添加工具调用
            else 工具调用响应
                Provider->>ProviderMsg: 添加工具调用响应
            end
        end
    end
    
    Provider->>API: 发送请求
    API-->>Provider: 返回响应
    
    Provider->>Provider: 解析响应
    Provider->>Provider: 创建ContentResponse
    Provider->>Provider: 设置Choices
    
    loop 对每个Choice
        Provider->>Provider: 设置Content
        Provider->>Provider: 设置StopReason
        Provider->>Provider: 设置GenerationInfo
        
        alt 包含函数调用
            Provider->>Provider: 设置FuncCall
        end
        
        alt 包含工具调用
            Provider->>Provider: 设置ToolCalls
        end
    end
    
    Provider-->>Model: 返回ContentResponse
    Model-->>App: 返回ContentResponse
```

## 工具调用流程

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant Tool as llms.Tool
    participant CallOptions as llms.CallOptions
    participant Model as llms.Model
    participant Provider as 具体LLM提供商
    participant ProviderTool as 提供商特定工具格式
    participant API as 外部LLM API
    participant Response as llms.ContentResponse
    participant ToolCall as llms.ToolCall
    
    App->>Tool: 创建工具定义
    App->>Tool: 设置工具类型("function")
    App->>Tool: 设置函数定义(名称、描述、参数)
    
    App->>CallOptions: 通过WithTools(tools)设置工具
    App->>CallOptions: 通过WithToolChoice设置工具选择
    
    App->>Model: GenerateContent(ctx, messages, options)
    Model->>Provider: 转发请求
    
    Provider->>Provider: 提取工具定义
    Provider->>ProviderTool: 转换为提供商特定工具格式
    
    Provider->>API: 发送带工具的请求
    API-->>Provider: 返回包含工具调用的响应
    
    Provider->>Response: 创建ContentResponse
    Provider->>ToolCall: 从API响应创建ToolCall
    ToolCall-->>Response: 添加到ContentChoice
    
    Provider-->>Model: 返回ContentResponse
    Model-->>App: 返回ContentResponse
    
    App->>App: 提取ToolCall信息
    App->>App: 执行工具调用
    App->>App: 创建ToolCallResponse
    
    App->>MessageContent: 创建新消息
    App->>MessageContent: 添加ToolCallResponse
    App->>Model: 继续对话，包含工具响应
```

## 流式响应处理流程

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant StreamFunc as 流处理函数
    participant CallOptions as llms.CallOptions
    participant Model as llms.Model
    participant Provider as 具体LLM提供商
    participant API as 外部LLM API
    participant Response as llms.ContentResponse
    
    App->>StreamFunc: 定义流处理函数
    App->>CallOptions: 通过WithStreamingFunc设置
    
    App->>Model: GenerateContent(ctx, messages, options)
    Model->>Provider: 转发请求
    
    Provider->>Provider: 检测流式选项
    Provider->>Provider: 设置流式请求参数
    
    Provider->>API: 发送流式请求
    
    loop 对每个响应块
        API-->>Provider: 返回响应块
        Provider->>Provider: 解析响应块
        Provider->>StreamFunc: 调用流处理函数(chunk)
        StreamFunc-->>Provider: 继续或停止
    end
    
    Provider->>Response: 创建完整ContentResponse
    Provider-->>Model: 返回ContentResponse
    Model-->>App: 返回ContentResponse
```

## 缓存机制流程

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant Cacher as llms.cache.Cacher
    participant Backend as 缓存后端
    participant Model as 原始LLM
    participant API as 外部LLM API
    
    App->>Backend: 创建缓存后端
    App->>Cacher: 创建缓存包装器(原始LLM, 后端)
    
    App->>Cacher: GenerateContent(ctx, messages, options)
    
    Cacher->>Cacher: 生成缓存键(消息+选项)
    Cacher->>Backend: Get(ctx, key)
    
    alt 缓存命中
        Backend-->>Cacher: 返回缓存的ContentResponse
        
        alt 设置了流处理函数
            Cacher->>Cacher: 调用流处理函数模拟流式响应
        end
        
        Cacher-->>App: 返回缓存的ContentResponse
        
    else 缓存未命中
        Backend-->>Cacher: 返回nil
        
        Cacher->>Model: GenerateContent(ctx, messages, options)
        Model->>API: 发送API请求
        API-->>Model: 返回响应
        Model-->>Cacher: 返回ContentResponse
        
        Cacher->>Backend: Put(ctx, key, response)
        Cacher-->>App: 返回ContentResponse
    end
```

## 错误处理流程

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant Model as llms.Model
    participant Provider as 具体LLM提供商
    participant API as 外部LLM API
    participant ErrorMapper as 错误映射器
    
    App->>Model: GenerateContent(ctx, messages, options)
    Model->>Provider: 转发请求
    
    Provider->>API: 发送API请求
    
    alt API返回错误
        API-->>Provider: 返回错误响应
        Provider->>ErrorMapper: 映射提供商特定错误
        ErrorMapper->>ErrorMapper: 分析错误类型
        
        alt 速率限制错误
            ErrorMapper-->>Provider: 返回ErrRateLimitExceeded
        else 无效请求错误
            ErrorMapper-->>Provider: 返回ErrInvalidRequest
        else 认证错误
            ErrorMapper-->>Provider: 返回ErrAuthenticationFailed
        else 权限错误
            ErrorMapper-->>Provider: 返回ErrPermissionDenied
        else 服务不可用错误
            ErrorMapper-->>Provider: 返回ErrServiceUnavailable
        else 内容过滤错误
            ErrorMapper-->>Provider: 返回ErrContentFiltered
        else 上下文长度错误
            ErrorMapper-->>Provider: 返回ErrContextLengthExceeded
        else 其他错误
            ErrorMapper-->>Provider: 返回原始错误
        end
        
        Provider-->>Model: 返回映射后的错误
        Model-->>App: 返回错误
    else API返回成功
        API-->>Provider: 返回成功响应
        Provider->>Provider: 处理响应
        Provider-->>Model: 返回ContentResponse
        Model-->>App: 返回ContentResponse
    end
```

## 中间件模式流程

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant Middleware as 中间件链
    participant Cacher as 缓存中间件
    participant Retry as 重试中间件
    participant RateLimit as 速率限制中间件
    participant Logging as 日志中间件
    participant Model as 原始LLM
    participant API as 外部LLM API
    
    App->>App: 创建原始LLM
    App->>App: 创建中间件链
    App->>App: 添加日志中间件
    App->>App: 添加速率限制中间件
    App->>App: 添加重试中间件
    App->>App: 添加缓存中间件
    
    App->>Middleware: GenerateContent(ctx, messages, options)
    
    Middleware->>Logging: 处理请求
    Logging->>Logging: 记录请求信息
    
    Logging->>RateLimit: 转发请求
    RateLimit->>RateLimit: 检查速率限制
    
    alt 超过速率限制
        RateLimit-->>Logging: 返回ErrRateLimitExceeded
        Logging->>Logging: 记录错误
        Logging-->>Middleware: 返回错误
        Middleware-->>App: 返回错误
    else 未超过速率限制
        RateLimit->>Retry: 转发请求
        
        Retry->>Cacher: 转发请求
        Cacher->>Cacher: 检查缓存
        
        alt 缓存命中
            Cacher-->>Retry: 返回缓存结果
            Retry-->>RateLimit: 返回结果
            RateLimit-->>Logging: 返回结果
            Logging->>Logging: 记录响应
            Logging-->>Middleware: 返回结果
            Middleware-->>App: 返回结果
        else 缓存未命中
            Cacher->>Model: 转发请求
            Model->>API: 发送API请求
            
            alt API返回错误
                API-->>Model: 返回错误
                Model-->>Cacher: 返回错误
                Cacher-->>Retry: 返回错误
                
                Retry->>Retry: 检查是否需要重试
                
                alt 需要重试且未超过最大重试次数
                    Retry->>Retry: 等待重试间隔
                    Retry->>Cacher: 重新发送请求
                    Note over Retry,Cacher: 重复上述流程
                else 不需要重试或超过最大重试次数
                    Retry-->>RateLimit: 返回最终错误
                    RateLimit-->>Logging: 返回错误
                    Logging->>Logging: 记录错误
                    Logging-->>Middleware: 返回错误
                    Middleware-->>App: 返回错误
                end
            else API返回成功
                API-->>Model: 返回成功响应
                Model-->>Cacher: 返回ContentResponse
                Cacher->>Cacher: 存储结果到缓存
                Cacher-->>Retry: 返回结果
                Retry-->>RateLimit: 返回结果
                RateLimit-->>Logging: 返回结果
                Logging->>Logging: 记录响应
                Logging-->>Middleware: 返回结果
                Middleware-->>App: 返回结果
            end
        end
    end
```

## 令牌计数流程

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant Counter as 令牌计数器
    participant Model as llms.Model
    participant Provider as 具体LLM提供商
    participant API as 外部LLM API
    
    App->>Counter: CountTokens(model, messages)
    
    alt 使用提供商特定计数器
        Counter->>Provider: 调用提供商特定计数方法
        Provider->>Provider: 使用提供商特定算法计数
        Provider-->>Counter: 返回令牌数
    else 使用通用计数器
        Counter->>Counter: 使用tiktoken或其他通用算法
        
        loop 对每个消息
            Counter->>Counter: 计算角色令牌
            
            loop 对每个内容部分
                alt 文本内容
                    Counter->>Counter: 计算文本令牌
                else 图片内容
                    Counter->>Counter: 估算图片令牌
                else 其他内容
                    Counter->>Counter: 估算其他内容令牌
                end
            end
        end
    end
    
    Counter-->>App: 返回总令牌数
    
    App->>Model: GenerateContent(ctx, messages, WithMaxTokens(max - counted))
    Model->>Provider: 转发请求
    Provider->>API: 发送API请求
    API-->>Provider: 返回响应
    Provider-->>Model: 返回ContentResponse
    Model-->>App: 返回ContentResponse
```

## 回调处理流程

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant Callbacks as 回调处理器
    participant Model as llms.Model
    participant Provider as 具体LLM提供商
    participant API as 外部LLM API
    
    App->>Callbacks: 注册回调处理器
    App->>Model: 设置回调处理器
    
    App->>Model: GenerateContent(ctx, messages, options)
    
    Model->>Callbacks: HandleLLMGenerateContentStart(ctx, messages)
    Callbacks-->>Model: 继续处理
    
    Model->>Provider: 转发请求
    Provider->>API: 发送API请求
    API-->>Provider: 返回响应
    Provider-->>Model: 返回ContentResponse
    
    Model->>Callbacks: HandleLLMGenerateContentEnd(ctx, response)
    Callbacks-->>Model: 继续处理
    
    Model-->>App: 返回ContentResponse
```

## 提供商实现流程

以 OpenAI 为例：

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant OpenAI as llms.openai.LLM
    participant Client as openaiclient.Client
    participant ChatRequest as openaiclient.ChatRequest
    participant ChatMessage as openaiclient.ChatMessage
    participant API as OpenAI API
    participant Response as llms.ContentResponse
    
    App->>OpenAI: GenerateContent(ctx, messages, options)
    
    OpenAI->>OpenAI: 处理回调(HandleLLMGenerateContentStart)
    OpenAI->>OpenAI: 应用调用选项
    
    OpenAI->>ChatMessage: 创建ChatMessage数组
    
    loop 对每个MessageContent
        OpenAI->>ChatMessage: 创建新ChatMessage
        OpenAI->>ChatMessage: 设置Role(system/assistant/user/function/tool)
        OpenAI->>ChatMessage: 设置MultiContent
        
        alt 是工具消息
            OpenAI->>ChatMessage: 提取ToolCallID和Content
        end
        
        OpenAI->>ChatMessage: 提取工具调用部分
        OpenAI->>ChatMessage: 设置ToolCalls
    end
    
    OpenAI->>ChatRequest: 创建ChatRequest
    OpenAI->>ChatRequest: 设置Model
    OpenAI->>ChatRequest: 设置Messages
    OpenAI->>ChatRequest: 设置其他参数(Temperature等)
    OpenAI->>ChatRequest: 设置Tools和ToolChoice
    
    OpenAI->>Client: CreateChat(ctx, req)
    Client->>API: 发送HTTP请求
    API-->>Client: 返回JSON响应
    Client->>Client: 解析JSON响应
    Client-->>OpenAI: 返回ChatCompletionResponse
    
    OpenAI->>Response: 创建ContentResponse
    
    loop 对每个Choice
        OpenAI->>Response: 设置Content
        OpenAI->>Response: 设置StopReason
        OpenAI->>Response: 设置GenerationInfo
        OpenAI->>Response: 设置FuncCall和ToolCalls
    end
    
    OpenAI->>OpenAI: 处理回调(HandleLLMGenerateContentEnd)
    OpenAI-->>App: 返回ContentResponse
```

## 总结与最佳实践

LangChainGo 的 llms 包通过清晰的接口设计和灵活的结构，提供了统一的 LLM 调用方式，支持多模态内容、工具调用、流式响应和缓存机制。通过实现 Model 接口，可以轻松集成不同的 LLM 提供商，而应用程序只需要使用统一的 API 即可。

### 最佳实践

1. **使用 GenerateContent 而非 Call**：Call 方法已弃用，应使用更通用的 GenerateContent 方法。

2. **利用缓存减少 API 调用**：对于重复的请求，使用缓存可以减少 API 调用，降低成本和延迟。

3. **合理设置 CallOptions**：根据需要设置适当的选项，如温度、最大令牌数等，以获得最佳结果。

4. **处理错误**：LLM API 可能会返回各种错误，应当妥善处理这些错误，特别是速率限制和上下文长度错误。

5. **使用中间件模式**：通过中间件模式可以添加日志、重试、缓存等功能，而不需要修改核心代码。

6. **计算令牌数**：在发送请求前计算令牌数，可以避免超出上下文长度限制，并优化成本。

7. **使用流式响应**：对于长响应，使用流式响应可以提供更好的用户体验，让用户更快看到结果。

8. **合理使用工具调用**：工具调用可以扩展 LLM 的能力，但应当谨慎使用，确保工具定义清晰且安全。

通过这些泳道图和最佳实践，开发者可以更好地理解和使用 LangChainGo 的 llms 包，构建强大的 LLM 应用。