---
title: "LangChainGo llms包对外暴露API分析"
date: "2025-06-26"
lastmod: "2025-06-26"
draft: false
author: "孙巨中"
description: "详细分析LangChainGo中llms包对外暴露的API，并以此为抓手对各部分流程进行泳道图分析，帮助理解其接口设计和使用方式"
keywords: ["LangChainGo", "Go语言", "LLM框架", "大语言模型", "API设计", "接口分析", "Model接口", "MessageContent"]
tags: ["架构设计", "Go语言", "LLM应用", "系统分析", "接口设计", "模块化架构", "AI框架"]
categories: ["系统架构", "人工智能", "编程语言"]
weight: 8005
showInHome: true
license: "CC BY-NC-ND"
featured_image: ""
summary: "本文详细分析LangChainGo中llms包对外暴露的API，并以此为抓手对各部分流程进行泳道图分析，帮助理解其接口设计和使用方式。"
---
# LangChainGo llms 包对外暴露 API 分析

本文档详细分析了 LangChainGo 中 llms 包对外暴露的 API，并以此为抓手对各部分流程进行泳道图分析。

## 目录

1. [对外暴露的核心 API](#对外暴露的核心-api)
2. [Model 接口调用流程](#model-接口调用流程)
3. [消息处理流程](#消息处理流程)
4. [工具调用流程](#工具调用流程)
5. [流式响应处理流程](#流式响应处理流程)
6. [缓存机制流程](#缓存机制流程)
7. [提供商实现流程](#提供商实现流程)

## 对外暴露的核心 API

LangChainGo 的 llms 包对外暴露的主要 API 包括：

### 1. Model 接口

```go
type Model interface {
    GenerateContent(ctx context.Context, messages []MessageContent, options ...CallOption) (ContentResponse, error)
    Call(ctx context.Context, prompt string, options ...CallOption) (*Response, error) // 已弃用
}
```

这是 llms 包的核心接口，所有 LLM 提供商必须实现此接口。`GenerateContent` 方法是主要方法，用于生成内容，而 `Call` 方法已弃用。

### 2. MessageContent 结构体

```go
type MessageContent struct {
    Role  string
    Parts []ContentPart
}
```

用于表示消息内容，包含角色和内容部分。

### 3. ContentPart 接口及其实现

```go
type ContentPart interface {
    // 标记接口
}

type TextContent struct {
    Text string
}

type ImageURLContent struct {
    URL    string
    Detail string
}

type BinaryContent struct {
    MIMEType string
    Data     []byte
}

type FunctionCall struct {
    Name      string
    Arguments string
}

type ToolCall struct {
    ID       string
    Type     string
    Function FunctionDefinition
}

type ToolCallResponse struct {
    ToolCallID string
    Content    string
}
```

这些结构体实现了 ContentPart 接口，用于表示不同类型的内容部分。

### 4. ContentResponse 结构体

```go
type ContentResponse struct {
    Choices []ContentChoice
}

type ContentChoice struct {
    Content        MessageContent
    StopReason     string
    GenerationInfo *GenerationInfo
    FuncCall       *FunctionCall
    ToolCalls      []*ToolCall
}

type GenerationInfo struct {
    PromptTokens     int
    CompletionTokens int
    TotalTokens      int
}
```

用于表示 LLM 的响应内容。

### 5. CallOptions 结构体及相关选项

```go
type CallOptions struct {
    Model                  string
    CandidateCount        int
    MaxTokens             int
    Temperature           float64
    StopWords             []string
    StreamingFunc         func(ctx context.Context, chunk []byte) bool
    StreamingReasoningFunc func(ctx context.Context, chunk []byte) bool
    TopK                  int
    TopP                  float64
    Seed                  int
    MinLength             int
    MaxLength             int
    N                     int
    RepetitionPenalty     float64
    FrequencyPenalty      float64
    PresencePenalty       float64
    JSONMode              bool
    Tools                 []Tool
    ToolChoice            *ToolChoice
    Functions             []FunctionDefinition // 已弃用
    FunctionCallBehavior  FunctionCallBehavior // 已弃用
    Metadata              map[string]string
    ResponseMIMEType      string
}
```

用于配置 LLM 调用的参数，包括模型参数、流式处理函数、工具和函数定义等。

### 6. ChatMessage 接口及其实现

```go
type ChatMessage interface {
    GetType() ChatMessageType
    GetContent() string
}

type AIChatMessage struct {
    Content          string
    FunctionCall     *FunctionCall
    ToolCalls        []*ToolCall
    ReasoningContent string
}

type HumanChatMessage struct {
    Content string
}

type SystemChatMessage struct {
    Content string
}

type GenericChatMessage struct {
    Content string
    Role    string
}

type FunctionChatMessage struct {
    Content string
    Name    string
}

type ToolChatMessage struct {
    Content string
    ID      string
    Name    string
}
```

这些结构体实现了 ChatMessage 接口，用于表示不同类型的聊天消息。

### 7. 工具和函数相关结构体

```go
type Tool struct {
    Type     string
    Function FunctionDefinition
}

type FunctionDefinition struct {
    Name        string
    Description string
    Parameters  map[string]interface{}
}

type ToolChoice struct {
    Type     string
    Function *FunctionReference
}

type FunctionReference struct {
    Name string
}
```

用于定义工具和函数，以及工具选择。

### 8. 缓存相关接口和结构体

```go
type Backend interface {
    Get(ctx context.Context, key string) (ContentResponse, error)
    Put(ctx context.Context, key string, response ContentResponse) error
}

type Cacher struct {
    model   Model
    backend Backend
}
```

用于缓存 LLM 响应，减少 API 调用。

## Model 接口调用流程

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant Model as llms.Model接口
    participant Provider as 具体LLM提供商实现
    participant API as 外部LLM API
    
    App->>App: 创建消息内容
    App->>App: 设置调用选项
    App->>Model: GenerateContent(ctx, messages, options)
    
    Model->>Provider: 转发请求
    Provider->>Provider: 转换消息格式
    Provider->>Provider: 应用调用选项
    Provider->>API: 发送API请求
    API-->>Provider: 返回响应
    Provider->>Provider: 转换响应格式
    Provider-->>Model: 返回ContentResponse
    Model-->>App: 返回ContentResponse
    
    App->>App: 处理响应内容
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
    
    App->>MessageContent: 创建消息(Role="user")
    
    App->>ContentPart: 创建TextContent("文本内容")
    ContentPart-->>MessageContent: 添加文本部分
    
    App->>ContentPart: 创建ImageURLContent("图片URL")
    ContentPart-->>MessageContent: 添加图片部分
    
    App->>Model: GenerateContent(ctx, [messageContent], options)
    
    Model->>Provider: 转发请求
    
    Provider->>Provider: 检查提供商能力
    
    loop 对每个消息
        Provider->>ProviderMsg: 创建提供商特定消息
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
    
    Provider->>Provider: 发送请求并处理响应
    Provider-->>Model: 返回ContentResponse
    Model-->>App: 返回ContentResponse
```

## 工具调用流程

```mermaid
sequenceDiagram
    participant App as 应用程序
    participant Tool as llms.Tool
    participant FuncDef as llms.FunctionDefinition
    participant CallOptions as llms.CallOptions
    participant Model as llms.Model
    participant Provider as 具体LLM提供商
    participant API as 外部LLM API
    participant Response as llms.ContentResponse
    
    App->>FuncDef: 创建函数定义
    App->>FuncDef: 设置名称("get_weather")
    App->>FuncDef: 设置描述("获取天气信息")
    App->>FuncDef: 设置参数("location"等)
    
    App->>Tool: 创建工具
    App->>Tool: 设置类型("function")
    App->>Tool: 设置函数定义
    
    App->>CallOptions: 通过WithTools([tool])设置工具
    App->>CallOptions: 通过WithToolChoice设置工具选择
    
    App->>Model: GenerateContent(ctx, messages, options)
    
    Model->>Provider: 转发请求
    Provider->>Provider: 提取工具定义
    Provider->>Provider: 转换为提供商特定工具格式
    Provider->>API: 发送带工具的请求
    
    API-->>Provider: 返回包含工具调用的响应
    
    Provider->>Response: 创建ContentResponse
    Provider->>Response: 设置ToolCalls
    
    Provider-->>Model: 返回ContentResponse
    Model-->>App: 返回ContentResponse
    
    App->>App: 提取ToolCall信息
    App->>App: 执行工具调用
    App->>App: 创建ToolCallResponse
    
    App->>App: 创建新消息
    App->>App: 添加ToolCallResponse
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
    
    Provider->>Provider: 创建完整ContentResponse
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
        OpenAI->>Response: 设置Content
        OpenAI->>Response: 设置StopReason
        OpenAI->>Response: 设置GenerationInfo
        OpenAI->>Response: 设置FuncCall和ToolCalls
    end
    
    OpenAI->>OpenAI: 处理回调(HandleLLMGenerateContentEnd)
    OpenAI-->>App: 返回ContentResponse
```

## 总结

LangChainGo 的 llms 包通过清晰的接口设计和灵活的结构，提供了统一的 LLM 调用方式。对外暴露的 API 主要包括 Model 接口、MessageContent 结构体、ContentPart 接口及其实现、ContentResponse 结构体、CallOptions 结构体及相关选项、ChatMessage 接口及其实现、工具和函数相关结构体以及缓存相关接口和结构体。

通过这些 API，开发者可以轻松地与不同的 LLM 提供商进行交互，处理多模态内容、工具调用、流式响应和缓存机制等功能。泳道图分析展示了各个流程的详细步骤，帮助开发者更好地理解和使用 llms 包。