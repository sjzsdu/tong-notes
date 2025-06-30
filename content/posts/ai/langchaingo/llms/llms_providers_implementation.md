---
title: "LangChainGo llms包提供商实现分析"
date: "2025-06-26"
lastmod: "2025-06-26"
draft: false
author: "孙巨中"
description: "详细分析LangChainGo中llms包各个提供商的实现方式和差异，包括OpenAI、Anthropic、Google AI、Hugging Face和Bedrock等，帮助理解不同LLM提供商的集成方式"
keywords: ["LangChainGo", "Go语言", "LLM框架", "大语言模型", "OpenAI", "Anthropic", "Google AI", "Hugging Face", "Bedrock"]
tags: ["架构设计", "Go语言", "LLM应用", "系统分析", "接口设计", "模块化架构", "AI框架"]
categories: ["ai", "langchaingo", "llm"]
weight: 8003
showInHome: true
license: "CC BY-NC-ND"
featured_image: ""
summary: "本文详细分析LangChainGo中llms包各个提供商的实现方式和差异，包括OpenAI、Anthropic、Google AI、Hugging Face和Bedrock等，帮助理解不同LLM提供商的集成方式。"
---
# LangChainGo llms 包提供商实现分析

本文档详细分析了 LangChainGo 中 llms 包各个提供商的实现方式和差异，帮助理解不同 LLM 提供商的集成方式。

## 目录

1. [提供商实现概述](#提供商实现概述)
2. [OpenAI 实现分析](#openai-实现分析)
3. [Anthropic 实现分析](#anthropic-实现分析)
4. [Google AI 实现分析](#google-ai-实现分析)
5. [Hugging Face 实现分析](#hugging-face-实现分析)
6. [Bedrock 实现分析](#bedrock-实现分析)
7. [提供商实现对比](#提供商实现对比)
8. [自定义提供商实现指南](#自定义提供商实现指南)

## 提供商实现概述

LangChainGo 的 llms 包支持多种 LLM 提供商，每个提供商都需要实现 `Model` 接口：

```go
type Model interface {
    GenerateContent(ctx context.Context, messages []MessageContent, options ...CallOption) (ContentResponse, error)
    Call(ctx context.Context, prompt string, options ...CallOption) (*Response, error) // 已弃用
}
```

各个提供商的实现通常遵循以下模式：

1. 创建提供商特定的客户端
2. 实现 `GenerateContent` 方法，将 LangChainGo 的消息格式转换为提供商特定的格式
3. 调用提供商的 API
4. 将提供商的响应转换回 LangChainGo 的 `ContentResponse` 格式

下面我们将详细分析各个主要提供商的实现。

## OpenAI 实现分析

### 核心结构

```go
type LLM struct {
    client          *openaiclient.Client
    model           string
    callbackManager *callbacks.Manager
}
```

### 初始化流程

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant OpenAI as llms.openai.LLM
    participant Client as openaiclient.Client
    
    App->>OpenAI: New(options...)
    OpenAI->>OpenAI: 处理选项(API密钥、模型等)
    OpenAI->>Client: 创建内部客户端
    Client->>Client: 设置API密钥、基础URL等
    Client-->>OpenAI: 返回客户端实例
    OpenAI-->>App: 返回LLM实例
```

### GenerateContent 实现

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant OpenAI as llms.openai.LLM
    participant Client as openaiclient.Client
    participant ChatRequest as openaiclient.ChatRequest
    participant API as OpenAI API
    participant Response as llms.ContentResponse
    
    App->>OpenAI: GenerateContent(ctx, messages, options)
    
    OpenAI->>OpenAI: 处理回调(HandleLLMGenerateContentStart)
    OpenAI->>OpenAI: 应用调用选项
    
    OpenAI->>OpenAI: 创建ChatMessage数组
    
    loop 对每个MessageContent
        OpenAI->>OpenAI: 创建新ChatMessage
        OpenAI->>OpenAI: 设置Role(system/assistant/user/function/tool)
        
        alt 是多模态内容
            OpenAI->>OpenAI: 创建MultiContent数组
            
            loop 对每个ContentPart
                alt 文本内容
                    OpenAI->>OpenAI: 添加文本内容
                else 图片URL内容
                    OpenAI->>OpenAI: 添加图片URL内容
                else 二进制内容
                    OpenAI->>OpenAI: 添加二进制内容并编码
                else 工具调用
                    OpenAI->>OpenAI: 添加工具调用
                else 工具调用响应
                    OpenAI->>OpenAI: 添加工具调用响应
                end
            end
            
            OpenAI->>OpenAI: 设置MultiContent
        else 是普通内容
            OpenAI->>OpenAI: 设置Content字符串
        end
        
        alt 是工具消息
            OpenAI->>OpenAI: 提取ToolCallID和Content
        end
        
        OpenAI->>OpenAI: 提取工具调用部分
        OpenAI->>OpenAI: 设置ToolCalls
    end
    
    OpenAI->>ChatRequest: 创建ChatRequest
    OpenAI->>ChatRequest: 设置Model
    OpenAI->>ChatRequest: 设置Messages
    OpenAI->>ChatRequest: 设置Temperature
    OpenAI->>ChatRequest: 设置MaxTokens
    OpenAI->>ChatRequest: 设置Stop
    OpenAI->>ChatRequest: 设置FrequencyPenalty
    OpenAI->>ChatRequest: 设置PresencePenalty
    OpenAI->>ChatRequest: 设置Seed
    OpenAI->>ChatRequest: 设置ResponseFormat
    OpenAI->>ChatRequest: 设置Tools和ToolChoice
    
    alt 设置了流处理函数
        OpenAI->>ChatRequest: 设置Stream=true
        OpenAI->>Client: CreateChat(ctx, req)
        
        loop 对每个响应块
            Client-->>OpenAI: 返回响应块
            OpenAI->>OpenAI: 解析响应块
            OpenAI->>OpenAI: 调用流处理函数
        end
        
        OpenAI->>OpenAI: 合并所有响应块
    else 未设置流处理函数
        OpenAI->>Client: CreateChat(ctx, req)
        Client-->>OpenAI: 返回完整响应
    end
    
    OpenAI->>Response: 创建ContentResponse
    
    loop 对每个Choice
        OpenAI->>Response: 创建ContentChoice
        OpenAI->>Response: 设置Content
        OpenAI->>Response: 设置StopReason
        OpenAI->>Response: 设置GenerationInfo
        
        alt 包含函数调用
            OpenAI->>Response: 设置FuncCall
        end
        
        alt 包含工具调用
            OpenAI->>Response: 设置ToolCalls
        end
    end
    
    OpenAI->>OpenAI: 处理回调(HandleLLMGenerateContentEnd)
    OpenAI-->>App: 返回ContentResponse
```

### 错误处理

OpenAI 实现会将 OpenAI API 的错误映射为 LangChainGo 的标准错误：

- 速率限制错误 -> `ErrRateLimitExceeded`
- 无效请求错误 -> `ErrInvalidRequest`
- 认证错误 -> `ErrAuthenticationFailed`
- 权限错误 -> `ErrPermissionDenied`
- 服务不可用错误 -> `ErrServiceUnavailable`
- 内容过滤错误 -> `ErrContentFiltered`
- 上下文长度错误 -> `ErrContextLengthExceeded`

## Anthropic 实现分析

### 核心结构

```go
type LLM struct {
    client          *anthropicclient.Client
    model           string
    callbackManager *callbacks.Manager
}
```

### 初始化流程

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant Anthropic as llms.anthropic.LLM
    participant Client as anthropicclient.Client
    
    App->>Anthropic: New(options...)
    Anthropic->>Anthropic: 处理选项(API密钥、模型等)
    Anthropic->>Client: 创建内部客户端
    Client->>Client: 设置API密钥、基础URL等
    Client-->>Anthropic: 返回客户端实例
    Anthropic-->>App: 返回LLM实例
```

### GenerateContent 实现

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant Anthropic as llms.anthropic.LLM
    participant Client as anthropicclient.Client
    participant MessagesRequest as anthropicclient.MessagesRequest
    participant API as Anthropic API
    participant Response as llms.ContentResponse
    
    App->>Anthropic: GenerateContent(ctx, messages, options)
    
    Anthropic->>Anthropic: 处理回调(HandleLLMGenerateContentStart)
    Anthropic->>Anthropic: 应用调用选项
    
    Anthropic->>Anthropic: 创建系统消息
    Anthropic->>Anthropic: 创建用户和助手消息
    
    loop 对每个MessageContent
        alt Role是system
            Anthropic->>Anthropic: 添加到系统消息
        else Role是user
            Anthropic->>Anthropic: 创建用户消息
            
            loop 对每个ContentPart
                alt 文本内容
                    Anthropic->>Anthropic: 添加文本内容
                else 图片URL内容
                    Anthropic->>Anthropic: 添加图片内容
                else 其他内容
                    Anthropic->>Anthropic: 忽略不支持的内容
                end
            end
            
            Anthropic->>Anthropic: 添加到用户消息列表
        else Role是assistant
            Anthropic->>Anthropic: 创建助手消息
            Anthropic->>Anthropic: 添加到助手消息列表
        else Role是tool
            Anthropic->>Anthropic: 创建工具响应消息
            Anthropic->>Anthropic: 添加到工具响应列表
        end
    end
    
    Anthropic->>MessagesRequest: 创建MessagesRequest
    Anthropic->>MessagesRequest: 设置Model
    Anthropic->>MessagesRequest: 设置System
    Anthropic->>MessagesRequest: 设置Messages
    Anthropic->>MessagesRequest: 设置Temperature
    Anthropic->>MessagesRequest: 设置MaxTokens
    Anthropic->>MessagesRequest: 设置StopSequences
    Anthropic->>MessagesRequest: 设置TopK
    Anthropic->>MessagesRequest: 设置TopP
    
    alt 设置了流处理函数
        Anthropic->>MessagesRequest: 设置Stream=true
        Anthropic->>Client: CreateMessages(ctx, req)
        
        loop 对每个响应块
            Client-->>Anthropic: 返回响应块
            Anthropic->>Anthropic: 解析响应块
            Anthropic->>Anthropic: 调用流处理函数
        end
        
        Anthropic->>Anthropic: 合并所有响应块
    else 未设置流处理函数
        Anthropic->>Client: CreateMessages(ctx, req)
        Client-->>Anthropic: 返回完整响应
    end
    
    Anthropic->>Response: 创建ContentResponse
    Anthropic->>Response: 设置Content
    Anthropic->>Response: 设置StopReason
    Anthropic->>Response: 设置GenerationInfo
    
    Anthropic->>Anthropic: 处理回调(HandleLLMGenerateContentEnd)
    Anthropic-->>App: 返回ContentResponse
```

### 特殊处理

Anthropic 实现有一些特殊处理：

1. 系统消息处理：Anthropic 将所有系统消息合并为一个系统消息
2. 多模态支持：仅支持文本和图片，不支持其他类型的内容
3. 工具调用：Claude 3 开始支持工具调用，但实现方式与 OpenAI 有所不同

## Google AI 实现分析

### 核心结构

```go
type LLM struct {
    client          *googleaiclient.Client
    model           string
    callbackManager *callbacks.Manager
}
```

### 初始化流程

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant GoogleAI as llms.googleai.LLM
    participant Client as googleaiclient.Client
    
    App->>GoogleAI: New(options...)
    GoogleAI->>GoogleAI: 处理选项(API密钥、模型等)
    GoogleAI->>Client: 创建内部客户端
    Client->>Client: 设置API密钥、基础URL等
    Client-->>GoogleAI: 返回客户端实例
    GoogleAI-->>App: 返回LLM实例
```

### GenerateContent 实现

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant GoogleAI as llms.googleai.LLM
    participant Client as googleaiclient.Client
    participant GenerateContentRequest as googleaiclient.GenerateContentRequest
    participant API as Google AI API
    participant Response as llms.ContentResponse
    
    App->>GoogleAI: GenerateContent(ctx, messages, options)
    
    GoogleAI->>GoogleAI: 处理回调(HandleLLMGenerateContentStart)
    GoogleAI->>GoogleAI: 应用调用选项
    
    GoogleAI->>GoogleAI: 创建Content数组
    
    loop 对每个MessageContent
        GoogleAI->>GoogleAI: 创建新Content
        GoogleAI->>GoogleAI: 设置Role(user/model/system)
        
        GoogleAI->>GoogleAI: 创建Part数组
        
        loop 对每个ContentPart
            alt 文本内容
                GoogleAI->>GoogleAI: 添加文本Part
            else 图片URL内容
                GoogleAI->>GoogleAI: 添加图片Part
            else 二进制内容
                GoogleAI->>GoogleAI: 添加二进制Part
            else 工具调用
                GoogleAI->>GoogleAI: 添加工具调用Part
            else 工具调用响应
                GoogleAI->>GoogleAI: 添加工具调用响应Part
            end
        end
        
        GoogleAI->>GoogleAI: 设置Parts
    end
    
    GoogleAI->>GenerateContentRequest: 创建GenerateContentRequest
    GoogleAI->>GenerateContentRequest: 设置Contents
    GoogleAI->>GenerateContentRequest: 设置GenerationConfig
    GoogleAI->>GenerateContentRequest: 设置Tools
    
    alt 设置了流处理函数
        GoogleAI->>Client: GenerateContentStream(ctx, req)
        
        loop 对每个响应块
            Client-->>GoogleAI: 返回响应块
            GoogleAI->>GoogleAI: 解析响应块
            GoogleAI->>GoogleAI: 调用流处理函数
        end
        
        GoogleAI->>GoogleAI: 合并所有响应块
    else 未设置流处理函数
        GoogleAI->>Client: GenerateContent(ctx, req)
        Client-->>GoogleAI: 返回完整响应
    end
    
    GoogleAI->>Response: 创建ContentResponse
    GoogleAI->>Response: 设置Content
    GoogleAI->>Response: 设置StopReason
    GoogleAI->>Response: 设置GenerationInfo
    GoogleAI->>Response: 设置ToolCalls
    
    GoogleAI->>GoogleAI: 处理回调(HandleLLMGenerateContentEnd)
    GoogleAI-->>App: 返回ContentResponse
```

### 特殊处理

Google AI 实现有一些特殊处理：

1. 角色映射：将 LangChainGo 的角色映射到 Google AI 的角色（user/model/system）
2. 多模态支持：完全支持文本、图片和二进制内容
3. 工具调用：支持 Google AI 特定的工具调用格式

## Hugging Face 实现分析

### 核心结构

```go
type LLM struct {
    client          *huggingfaceclient.Client
    model           string
    callbackManager *callbacks.Manager
}
```

### 初始化流程

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant HuggingFace as llms.huggingface.LLM
    participant Client as huggingfaceclient.Client
    
    App->>HuggingFace: New(options...)
    HuggingFace->>HuggingFace: 处理选项(API密钥、模型等)
    HuggingFace->>Client: 创建内部客户端
    Client->>Client: 设置API密钥、基础URL等
    Client-->>HuggingFace: 返回客户端实例
    HuggingFace-->>App: 返回LLM实例
```

### GenerateContent 实现

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant HuggingFace as llms.huggingface.LLM
    participant Client as huggingfaceclient.Client
    participant TextGenerationRequest as huggingfaceclient.TextGenerationRequest
    participant API as Hugging Face API
    participant Response as llms.ContentResponse
    
    App->>HuggingFace: GenerateContent(ctx, messages, options)
    
    HuggingFace->>HuggingFace: 处理回调(HandleLLMGenerateContentStart)
    HuggingFace->>HuggingFace: 应用调用选项
    
    HuggingFace->>HuggingFace: 将消息转换为提示字符串
    
    loop 对每个MessageContent
        alt Role是system
            HuggingFace->>HuggingFace: 添加系统提示
        else Role是user
            HuggingFace->>HuggingFace: 添加用户提示
        else Role是assistant
            HuggingFace->>HuggingFace: 添加助手提示
        end
    end
    
    HuggingFace->>TextGenerationRequest: 创建TextGenerationRequest
    HuggingFace->>TextGenerationRequest: 设置Inputs
    HuggingFace->>TextGenerationRequest: 设置Parameters
    
    HuggingFace->>Client: TextGeneration(ctx, req)
    Client-->>HuggingFace: 返回响应
    
    HuggingFace->>Response: 创建ContentResponse
    HuggingFace->>Response: 设置Content
    
    HuggingFace->>HuggingFace: 处理回调(HandleLLMGenerateContentEnd)
    HuggingFace-->>App: 返回ContentResponse
```

### 特殊处理

Hugging Face 实现有一些特殊处理：

1. 提示格式化：将消息转换为单一提示字符串
2. 多模态支持：仅支持文本，不支持图片和其他类型的内容
3. 工具调用：不支持工具调用

## Bedrock 实现分析

### 核心结构

```go
type LLM struct {
    client          *bedrockclient.Client
    model           string
    callbackManager *callbacks.Manager
}
```

### 初始化流程

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant Bedrock as llms.bedrock.LLM
    participant Client as bedrockclient.Client
    
    App->>Bedrock: New(options...)
    Bedrock->>Bedrock: 处理选项(AWS凭证、模型等)
    Bedrock->>Client: 创建内部客户端
    Client->>Client: 设置AWS凭证、区域等
    Client-->>Bedrock: 返回客户端实例
    Bedrock-->>App: 返回LLM实例
```

### GenerateContent 实现

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant Bedrock as llms.bedrock.LLM
    participant Client as bedrockclient.Client
    participant Request as bedrockclient.InvokeModelRequest
    participant API as AWS Bedrock API
    participant Response as llms.ContentResponse
    
    App->>Bedrock: GenerateContent(ctx, messages, options)
    
    Bedrock->>Bedrock: 处理回调(HandleLLMGenerateContentStart)
    Bedrock->>Bedrock: 应用调用选项
    
    Bedrock->>Bedrock: 检测模型提供商(Anthropic/Amazon/AI21/Cohere等)
    
    alt Anthropic模型
        Bedrock->>Bedrock: 创建Anthropic格式请求
    else Amazon模型
        Bedrock->>Bedrock: 创建Amazon格式请求
    else AI21模型
        Bedrock->>Bedrock: 创建AI21格式请求
    else Cohere模型
        Bedrock->>Bedrock: 创建Cohere格式请求
    else 其他模型
        Bedrock->>Bedrock: 创建通用格式请求
    end
    
    Bedrock->>Request: 创建InvokeModelRequest
    Bedrock->>Request: 设置ModelId
    Bedrock->>Request: 设置Body
    
    alt 设置了流处理函数
        Bedrock->>Client: InvokeModelWithResponseStream(ctx, req)
        
        loop 对每个响应块
            Client-->>Bedrock: 返回响应块
            Bedrock->>Bedrock: 解析响应块
            Bedrock->>Bedrock: 调用流处理函数
        end
        
        Bedrock->>Bedrock: 合并所有响应块
    else 未设置流处理函数
        Bedrock->>Client: InvokeModel(ctx, req)
        Client-->>Bedrock: 返回完整响应
    end
    
    Bedrock->>Response: 创建ContentResponse
    Bedrock->>Response: 设置Content
    
    Bedrock->>Bedrock: 处理回调(HandleLLMGenerateContentEnd)
    Bedrock-->>App: 返回ContentResponse
```

### 特殊处理

Bedrock 实现有一些特殊处理：

1. 模型提供商检测：根据模型 ID 检测提供商，并使用相应的请求格式
2. 多模态支持：根据模型提供商的能力支持不同类型的内容
3. 工具调用：根据模型提供商的能力支持工具调用

## 提供商实现对比

| 提供商 | 多模态支持 | 工具调用 | 流式响应 | 特殊处理 |
|-------|----------|---------|---------|--------|
| OpenAI | 文本、图片、二进制 | 完全支持 | 支持 | 完整的工具调用支持 |
| Anthropic | 文本、图片 | 部分支持 | 支持 | 系统消息合并 |
| Google AI | 文本、图片、二进制 | 支持 | 支持 | 特定的工具调用格式 |
| Hugging Face | 仅文本 | 不支持 | 不支持 | 提示格式化 |
| Bedrock | 根据模型而定 | 根据模型而定 | 支持 | 模型提供商检测 |

## 自定义提供商实现指南

要实现自定义 LLM 提供商，需要遵循以下步骤：

1. 创建提供商特定的客户端
2. 实现 `Model` 接口
3. 实现 `GenerateContent` 方法，将 LangChainGo 的消息格式转换为提供商特定的格式
4. 调用提供商的 API
5. 将提供商的响应转换回 LangChainGo 的 `ContentResponse` 格式

示例框架：

```go
package customllm

import (
    "context"
    
    "github.com/tmc/langchaingo/llms"
)

type LLM struct {
    client          *CustomClient
    model           string
    callbackManager *callbacks.Manager
}

func New(options ...Option) (*LLM, error) {
    llm := &LLM{}
    
    // 应用选项
    for _, option := range options {
        option(llm)
    }
    
    // 创建客户端
    client, err := NewClient(llm.apiKey, llm.baseURL)
    if err != nil {
        return nil, err
    }
    llm.client = client
    
    return llm, nil
}

func (l *LLM) GenerateContent(ctx context.Context, messages []llms.MessageContent, options ...llms.CallOption) (llms.ContentResponse, error) {
    // 处理回调
    if l.callbackManager != nil {
        l.callbackManager.HandleLLMGenerateContentStart(ctx, messages)
    }
    
    // 应用选项
    opts := llms.ApplyOptions(options...)
    
    // 转换消息格式
    customMessages := convertMessages(messages)
    
    // 创建请求
    req := &CustomRequest{
        Model:       l.model,
        Messages:    customMessages,
        Temperature: opts.Temperature,
        MaxTokens:   opts.MaxTokens,
        // 其他参数
    }
    
    // 调用 API
    var resp *CustomResponse
    var err error
    
    if opts.StreamingFunc != nil {
        // 流式处理
        resp, err = l.client.StreamGenerate(ctx, req, opts.StreamingFunc)
    } else {
        // 非流式处理
        resp, err = l.client.Generate(ctx, req)
    }
    
    if err != nil {
        return llms.ContentResponse{}, err
    }
    
    // 转换响应格式
    contentResp := convertResponse(resp)
    
    // 处理回调
    if l.callbackManager != nil {
        l.callbackManager.HandleLLMGenerateContentEnd(ctx, contentResp)
    }
    
    return contentResp, nil
}

func (l *LLM) Call(ctx context.Context, prompt string, options ...llms.CallOption) (*llms.Response, error) {
    // 已弃用，但为了兼容性仍需实现
    // 将单一提示转换为消息格式，然后调用 GenerateContent
    messages := []llms.MessageContent{
        {
            Role: "user",
            Parts: []llms.ContentPart{
                llms.TextContent{
                    Text: prompt,
                },
            },
        },
    }
    
    resp, err := l.GenerateContent(ctx, messages, options...)
    if err != nil {
        return nil, err
    }
    
    // 转换为旧的响应格式
    return &llms.Response{
        Content: resp.Choices[0].Content.Parts[0].(llms.TextContent).Text,
        // 其他字段
    }, nil
}
```

## 总结

LangChainGo 的 llms 包通过统一的 `Model` 接口支持多种 LLM 提供商，每个提供商的实现都遵循类似的模式，但也有各自的特殊处理。了解这些实现细节和差异，有助于开发者选择合适的提供商，并在需要时实现自定义提供商。

通过本文的分析，我们可以看到 LangChainGo 的 llms 包设计得非常灵活，能够适应不同提供商的 API 差异，同时为应用程序提供统一的接口。这种设计使得开发者可以轻松地切换不同的 LLM 提供商，而不需要修改应用程序的核心逻辑。