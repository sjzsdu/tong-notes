---
title: "LangChainGo llms包错误处理与中间件流程"
date: "2025-06-26"
lastmod: "2025-06-26"
draft: false
author: "孙巨中"
description: "通过泳道图分析LangChainGo中llms包的错误处理和中间件流程，包括错误映射、重试机制和中间件链等，帮助理解其异常处理机制"
keywords: ["LangChainGo", "Go语言", "LLM框架", "大语言模型", "错误处理", "中间件", "泳道图", "异常处理"]
tags: ["架构设计", "Go语言", "LLM应用", "系统分析", "接口设计", "模块化架构", "AI框架"]
categories: ["系统架构", "人工智能", "编程语言"]
weight: 8007
showInHome: true
license: "CC BY-NC-ND"
featured_image: ""
summary: "本文通过泳道图分析LangChainGo中llms包的错误处理和中间件流程，包括错误映射、重试机制和中间件链等，帮助理解其异常处理机制。"
---
# LangChainGo llms 包错误处理与中间件流程

本文档通过泳道图分析 LangChainGo 中 llms 包的错误处理和中间件流程，以帮助理解其工作原理。

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

## 提供商特定错误处理流程 (以OpenAI为例)

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant OpenAI as llms.openai.LLM
    participant Client as openaiclient.Client
    participant API as OpenAI API
    participant ErrorMapper as 错误映射器
    
    App->>OpenAI: GenerateContent(ctx, messages, options)
    OpenAI->>Client: CreateChat(ctx, req)
    Client->>API: 发送HTTP请求
    
    alt API返回错误
        API-->>Client: 返回错误响应(HTTP 4xx/5xx)
        Client->>Client: 解析错误响应
        
        alt HTTP 429 Too Many Requests
            Client-->>OpenAI: 返回速率限制错误
            OpenAI->>ErrorMapper: 映射为ErrRateLimitExceeded
        else HTTP 400 Bad Request
            Client-->>OpenAI: 返回无效请求错误
            OpenAI->>ErrorMapper: 映射为ErrInvalidRequest
        else HTTP 401 Unauthorized
            Client-->>OpenAI: 返回认证错误
            OpenAI->>ErrorMapper: 映射为ErrAuthenticationFailed
        else HTTP 403 Forbidden
            Client-->>OpenAI: 返回权限错误
            OpenAI->>ErrorMapper: 映射为ErrPermissionDenied
        else HTTP 500 Internal Server Error
            Client-->>OpenAI: 返回服务器错误
            OpenAI->>ErrorMapper: 映射为ErrServiceUnavailable
        else 内容过滤错误
            Client-->>OpenAI: 返回内容过滤错误
            OpenAI->>ErrorMapper: 映射为ErrContentFiltered
        else 上下文长度错误
            Client-->>OpenAI: 返回上下文长度错误
            OpenAI->>ErrorMapper: 映射为ErrContextLengthExceeded
        else 其他错误
            Client-->>OpenAI: 返回原始错误
            OpenAI->>ErrorMapper: 保留原始错误
        end
        
        ErrorMapper-->>App: 返回映射后的错误
    else API返回成功
        API-->>Client: 返回成功响应
        Client->>Client: 解析JSON响应
        Client-->>OpenAI: 返回ChatCompletionResponse
        OpenAI->>OpenAI: 转换为ContentResponse
        OpenAI-->>App: 返回ContentResponse
    end
```

## 总结

LangChainGo 的 llms 包通过一系列结构化的流程处理错误、中间件、令牌计数和回调。这些流程通过清晰的接口和抽象层次，使得不同的 LLM 提供商可以统一集成到框架中，同时保持各自的特性和功能。

通过这些泳道图，我们可以更清晰地理解 llms 包的工作原理，以及各个组件之间的交互关系。这有助于开发者更好地使用和扩展 LangChainGo 框架。