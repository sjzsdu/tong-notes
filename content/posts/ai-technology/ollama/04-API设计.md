# API设计详解

## 🌐 API架构概览

Ollama提供**RESTful API**设计，兼容OpenAI格式，支持流式和非流式响应模式。

```mermaid
graph TB
    subgraph "API入口层"
        Router[Gin路由器<br/>URL路径匹配]
        Middleware[中间件链<br/>CORS/Auth/RateLimit]
        Handler[处理器函数<br/>业务逻辑]
    end
    
    subgraph "核心API端点"
        Generate["/api/generate"<br/>文本生成]
        Chat["/api/chat"<br/>对话聊天]
        Embed["/api/embed"<br/>文本嵌入]
        Models["/api/tags"<br/>模型管理]
    end
    
    subgraph "兼容性API"
        OpenAI_Chat["/v1/chat/completions"<br/>OpenAI兼容]
        OpenAI_Embed["/v1/embeddings"<br/>OpenAI兼容]
        OpenAI_Models["/v1/models"<br/>OpenAI兼容]
    end
    
    subgraph "管理API"
        Pull["/api/pull"<br/>下载模型]
        Push["/api/push"<br/>上传模型]  
        Create["/api/create"<br/>创建模型]
        Delete["/api/delete"<br/>删除模型]
    end
    
    Router --> Middleware
    Middleware --> Handler
    
    Handler --> Generate
    Handler --> Chat
    Handler --> Embed
    Handler --> Models
    
    Handler --> OpenAI_Chat
    Handler --> OpenAI_Embed
    Handler --> OpenAI_Models
    
    Handler --> Pull
    Handler --> Push
    Handler --> Create
    Handler --> Delete
```

## 📝 核心API端点详解

### 1. 文本生成 API
```http
POST /api/generate
Content-Type: application/json

{
  "model": "llama2",
  "prompt": "Why is the sky blue?",
  "stream": true,
  "options": {
    "temperature": 0.7,
    "top_p": 0.9,
    "max_tokens": 2048
  }
}
```

**响应格式**:
```mermaid
sequenceDiagram
    participant Client as 客户端
    participant API as API服务器
    participant Model as 模型引擎
    
    Client->>API: POST /api/generate
    API->>API: 验证请求参数
    API->>Model: 启动推理任务
    
    alt stream=true (流式响应)
        loop 每个生成的token
            Model-->>API: 部分结果
            API-->>Client: HTTP chunk
            Note over Client: {"response": "The", "done": false}
        end
        Model-->>API: 最终结果+统计
        API-->>Client: 最后chunk
        Note over Client: {"response": "", "done": true, "total_duration": 1500}
    else stream=false (完整响应)
        Model-->>API: 完整结果
        API-->>Client: 单次响应
        Note over Client: {"response": "完整文本...", "done": true}
    end
```

### 2. 对话聊天 API
```http
POST /api/chat
Content-Type: application/json

{
  "model": "llama2",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "stream": true
}
```

**消息格式标准**:
```mermaid
classDiagram
    class Message {
        +role: string
        +content: string
        +images: []string
        +tool_calls: []ToolCall
    }
    
    class ToolCall {
        +id: string
        +type: string
        +function: Function
    }
    
    class Function {
        +name: string
        +arguments: string
    }
    
    Message --> ToolCall : 包含
    ToolCall --> Function : 包含
    
    note for Message "支持system/user/assistant/tool角色"
    note for ToolCall "工具调用支持"
```

### 3. 模型管理 API

#### 列出模型
```http
GET /api/tags
```

```json
{
  "models": [
    {
      "name": "llama2:latest",
      "size": 3825819519,
      "digest": "fe938a131f40e6f6d40083c9f0f430a515233eb2edaa6d72eb85c50d64f2300e",
      "modified_at": "2023-12-07T09:32:18.757212583-08:00"
    }
  ]
}
```

#### 下载模型
```mermaid
sequenceDiagram
    participant Client as 客户端
    participant API as API服务器  
    participant Registry as 模型注册表
    participant Storage as 本地存储
    
    Client->>API: POST /api/pull {"model": "llama2"}
    API->>Registry: 查询模型信息
    Registry-->>API: 返回模型清单
    
    loop 下载模型文件
        API->>Registry: 下载层文件
        Registry-->>API: 文件数据流
        API->>Storage: 保存到本地
        API-->>Client: 进度更新
        Note over Client: {"status": "downloading", "completed": 1024, "total": 4096}
    end
    
    API->>Storage: 验证文件完整性
    Storage-->>API: 验证成功
    API-->>Client: 下载完成
    Note over Client: {"status": "success"}
```

## 🔄 OpenAI兼容性

### API映射关系
| OpenAI API | Ollama API | 功能映射 |
|------------|------------|----------|
| `/v1/chat/completions` | `/api/chat` | 对话补全 |
| `/v1/completions` | `/api/generate` | 文本生成 |
| `/v1/embeddings` | `/api/embed` | 文本嵌入 |
| `/v1/models` | `/api/tags` | 模型列表 |

### 参数转换机制
```mermaid
flowchart LR
    subgraph "OpenAI格式"
        OpenAI_Req[OpenAI请求<br/>标准参数]
        OpenAI_Resp[OpenAI响应<br/>标准格式]
    end
    
    subgraph "转换中间件"
        ParamMap[参数映射<br/>字段转换]
        RespTransform[响应转换<br/>格式适配]
    end
    
    subgraph "Ollama格式"
        Ollama_Req[Ollama请求<br/>内部参数]
        Ollama_Resp[Ollama响应<br/>内部格式]
    end
    
    OpenAI_Req --> ParamMap
    ParamMap --> Ollama_Req
    
    Ollama_Resp --> RespTransform
    RespTransform --> OpenAI_Resp
```

## 📊 请求响应数据结构

### 生成请求结构
```go
type GenerateRequest struct {
    Model     string                 `json:"model"`
    Prompt    string                 `json:"prompt"`
    Suffix    string                 `json:"suffix,omitempty"`
    System    string                 `json:"system,omitempty"`
    Template  string                 `json:"template,omitempty"`
    Context   []int                  `json:"context,omitempty"`
    Stream    *bool                  `json:"stream,omitempty"`
    Raw       bool                   `json:"raw,omitempty"`
    Format    json.RawMessage        `json:"format,omitempty"`
    KeepAlive *Duration              `json:"keep_alive,omitempty"`
    Images    []ImageData            `json:"images,omitempty"`
    Options   map[string]interface{} `json:"options,omitempty"`
}
```

### 响应结构设计
```mermaid
classDiagram
    class GenerateResponse {
        +model: string
        +created_at: time.Time
        +response: string
        +done: boolean
        +context: []int
        +total_duration: time.Duration
        +load_duration: time.Duration
        +prompt_eval_count: int
        +prompt_eval_duration: time.Duration
        +eval_count: int
        +eval_duration: time.Duration
    }
    
    class ChatResponse {
        +model: string
        +created_at: time.Time
        +message: Message
        +done: boolean
        +total_duration: time.Duration
        +load_duration: time.Duration
        +prompt_eval_count: int
        +prompt_eval_duration: time.Duration
        +eval_count: int
        +eval_duration: time.Duration
    }
    
    class Metrics {
        +prompt_eval_count: int
        +prompt_eval_duration: time.Duration
        +eval_count: int
        +eval_duration: time.Duration
    }
    
    GenerateResponse --> Metrics : 包含
    ChatResponse --> Metrics : 包含
```

## 🔧 错误处理机制

### HTTP状态码设计
```mermaid
graph LR
    subgraph "成功响应"
        OK[200 OK<br/>请求成功]
        Created[201 Created<br/>模型创建成功]
    end
    
    subgraph "客户端错误"
        BadRequest[400 Bad Request<br/>请求参数错误]
        NotFound[404 Not Found<br/>模型不存在]
        TooLarge[413 Payload Too Large<br/>请求体过大]
    end
    
    subgraph "服务器错误"
        InternalError[500 Internal Server Error<br/>服务器内部错误]
        NotImplemented[501 Not Implemented<br/>功能未实现]
        ServiceUnavailable[503 Service Unavailable<br/>服务不可用]
    end
```

### 错误响应格式
```json
{
  "error": "model not found",
  "details": "The model 'llama3' was not found. Available models: llama2, mistral",
  "code": "MODEL_NOT_FOUND",
  "timestamp": "2023-12-07T17:32:18Z"
}
```

## 🚀 流式响应实现

### 服务端推送事件流
```mermaid
sequenceDiagram
    participant Client as 客户端
    participant Server as 服务器
    participant Engine as 推理引擎
    
    Client->>Server: POST /api/chat (stream=true)
    Server->>Server: 设置流式响应头
    Note over Server: Content-Type: application/json<br/>Transfer-Encoding: chunked
    
    Server->>Engine: 开始推理
    
    loop 生成每个token
        Engine->>Engine: 前向传播计算
        Engine-->>Server: 新token
        Server->>Server: 构造JSON响应
        Server-->>Client: HTTP chunk
        Note over Client: data: {"message":{"content":"Hello"},"done":false}\n\n
        Client->>Client: 解析并显示token
    end
    
    Engine-->>Server: 推理完成+统计信息
    Server-->>Client: 最终chunk
    Note over Client: data: {"done":true,"total_duration":1500}\n\n
    Server-->>Client: 关闭连接
```

### 客户端流式处理
```javascript
async function* streamChat(messages) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      model: 'llama2',
      messages: messages,
      stream: true
    })
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        const data = JSON.parse(line);
        yield data;
      }
    }
  }
}
```

## 📈 性能优化特性

### 请求批处理
```mermaid
graph TB
    subgraph "批处理策略"
        RequestBatch[请求批处理<br/>合并相似请求]
        TokenBatch[Token批处理<br/>并行生成多token]
        ResponseBatch[响应批处理<br/>批量返回结果]
    end
    
    subgraph "缓存优化"
        PromptCache[提示词缓存<br/>相同prompt复用]
        ModelCache[模型缓存<br/>热门模型常驻]
        ResponseCache[响应缓存<br/>确定性结果缓存]
    end
    
    subgraph "连接优化"
        KeepAlive[连接保持<br/>减少握手开销]
        Compression[响应压缩<br/>减少传输量]
        Pipelining[请求管道<br/>并行处理]
    end
    
    RequestBatch --> PromptCache
    TokenBatch --> ModelCache
    ResponseBatch --> ResponseCache
    
    PromptCache --> KeepAlive
    ModelCache --> Compression
    ResponseCache --> Pipelining
```

---

**相关代码文件**:
- `server/routes.go` - API路由和处理器
- `api/types.go` - 请求响应数据结构
- `middleware/` - 中间件实现
- `openai/` - OpenAI兼容性实现

**下一步**: 查看 [模型管理](./05-模型管理.md) 了解模型生命周期管理