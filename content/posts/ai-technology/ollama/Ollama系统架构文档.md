# Ollama 系统架构文档

## 项目概览

Ollama 是一个本地大语言模型推理服务平台，支持多种模型格式和硬件加速。它提供了简洁的 API 接口，支持模型下载、管理和推理服务。

## 系统架构图

```mermaid
graph TB
    %% 客户端层
    Client[客户端/CLI] --> |HTTP/API| Server[HTTP服务器]
    WebClient[Web客户端] --> |HTTP/API| Server
    
    %% 服务层
    Server --> Router[路由处理器]
    Router --> |generate| GenerateHandler[生成处理器]
    Router --> |chat| ChatHandler[对话处理器]
    Router --> |pull| PullHandler[模型下载]
    Router --> |create| CreateHandler[模型创建]
    
    %% 调度层
    GenerateHandler --> Scheduler[模型调度器]
    ChatHandler --> Scheduler
    Scheduler --> |管理运行器| RunnerRef[运行器引用]
    
    %% 推理层
    RunnerRef --> LLMServer[LLM服务器]
    LLMServer --> |llamarunner| LlamaRunner[Llama运行器]
    LLMServer --> |ollamarunner| OllamaRunner[Ollama运行器]
    
    %% 硬件抽象层
    LlamaRunner --> Backend[后端接口]
    OllamaRunner --> Backend
    Backend --> GGML[GGML后端]
    GGML --> |CPU| CPUDevice[CPU设备]
    GGML --> |GPU| GPUDevice[GPU设备]
    
    %% 存储层
    CreateHandler --> ModelStorage[模型存储]
    PullHandler --> ModelStorage
    ModelStorage --> FileSystem[文件系统]
    ModelStorage --> Registry[模型注册表]

    %% 发现层
    Scheduler --> Discover[设备发现]
    Discover --> |检测| GPUInfo[GPU信息]
    Discover --> |检测| CPUInfo[CPU信息]
```

此架构图展示了Ollama的分层设计：从客户端HTTP请求到底层硬件设备的完整数据流。核心调度器负责模型生命周期管理，推理引擎抽象了不同的运行时实现，设备发现模块自动检测可用的计算资源。

## 核心组件关系图

```mermaid
classDiagram
    class Server {
        +sched: Scheduler
        +GenerateHandler()
        +ChatHandler()
        +PullHandler()
    }
    
    class Scheduler {
        +loaded: map[string]*runnerRef
        +pendingReqCh: chan
        +GetRunner()
        +load()
        +expireRunner()
    }
    
    class RunnerRef {
        +llama: LlamaServer
        +refCount: atomic.Int32
        +sessionDuration: time.Duration
        +Completion()
    }
    
    class LlamaServer {
        <<interface>>
        +Completion()
        +Load()
        +Close()
    }
    
    class LlmServer {
        +port: int
        +cmd: exec.Cmd
        +options: api.Options
        +Completion()
        +WaitUntilRunning()
    }
    
    class Model {
        +Config: ConfigV2
        +Messages: []api.Message
        +Template: template.Template
    }
    
    class Backend {
        +modelPath: string
        +layers: map[int]layer
        +Load()
        +BackendDevices()
    }
    
    Server --> Scheduler : 使用
    Scheduler --> RunnerRef : 管理
    RunnerRef --> LlamaServer : 包装
    LlmServer ..|> LlamaServer : 实现
    RunnerRef --> Model : 关联
    LlmServer --> Backend : 使用
```

该类图显示了核心组件间的依赖关系：Server 通过 Scheduler 管理多个 RunnerRef，每个 RunnerRef 封装一个 LlamaServer 实例，实现模型的并发访问和生命周期管理。

## 请求处理时序图

```mermaid
sequenceDiagram
    participant C as 客户端
    participant S as Server
    participant Sch as Scheduler
    participant R as RunnerRef
    participant L as LlamaServer
    participant B as Backend
    
    C->>S: POST /api/generate
    S->>S: 解析请求参数
    S->>Sch: GetRunner(model, options)
    
    alt 模型未加载
        Sch->>Sch: 检查资源可用性
        Sch->>L: NewLlamaServer()
        L->>B: Load(model)
        B-->>L: 加载完成
        Sch->>R: 创建RunnerRef
        Sch->>Sch: 加入loaded映射
    else 模型已加载
        Sch->>R: 增加引用计数
    end
    
    Sch-->>S: 返回RunnerRef
    S->>R: Completion(prompt, options)
    R->>L: Completion(request)
    
    loop 流式输出
        L->>L: 推理计算
        L-->>R: CompletionResponse
        R-->>S: 转发响应
        S-->>C: HTTP流式响应
    end
    
    S->>R: 完成，释放引用
    R->>R: 减少引用计数
    
    alt 引用计数为0且超时
        Sch->>R: 卸载模型
        R->>L: Close()
    end
```

此时序图展示了从HTTP请求到模型推理的完整流程，包括模型的懒加载机制和资源管理策略。调度器实现了智能的模型生命周期管理，避免频繁加载卸载。

## 设备发现与调度

```mermaid
graph LR
    subgraph "设备发现"
        Discover[Discovery模块] --> GPU[GPU检测]
        Discover --> CPU[CPU检测]
        GPU --> CUDA[CUDA设备]
        GPU --> ROCm[ROCm设备]
        GPU --> Vulkan[Vulkan设备]
        GPU --> Metal[Metal设备]
    end
    
    subgraph "资源调度"
        Scheduler[调度器] --> |查询| DeviceInfo[设备信息]
        DeviceInfo --> Memory[内存信息]
        DeviceInfo --> Compute[计算能力]
        Scheduler --> |分配| GPULayers[GPU层分配]
        Scheduler --> |分配| CPULayers[CPU层分配]
    end
    
    subgraph "后端适配"
        GPULayers --> GGML[GGML后端]
        CPULayers --> GGML
        GGML --> |优化| Kernels[计算内核]
        Kernels --> Hardware[硬件执行]
    end
    
    Discover --> Scheduler
    Scheduler --> Backend[后端接口]
    Backend --> GGML
```

设备发现模块自动检测系统中的可用计算设备，调度器根据模型需求和设备能力进行智能分配，GGML后端提供统一的硬件抽象接口。

## 数据流向图

```mermaid
flowchart TD
    subgraph "输入处理"
        Input[用户输入] --> Parse[请求解析]
        Parse --> Validate[参数验证]
        Parse --> Template[模板渲染]
    end
    
    subgraph "模型管理"
        Validate --> ModelLoad{模型已加载?}
        ModelLoad -->|否| Download[下载模型]
        Download --> LoadModel[加载到内存]
        ModelLoad -->|是| GetRunner[获取运行器]
        LoadModel --> GetRunner
    end
    
    subgraph "推理计算"
        GetRunner --> Tokenize[文本分词]
        Tokenize --> Embed[嵌入计算]
        Embed --> Attention[注意力计算]
        Attention --> Generate[文本生成]
        Generate --> Decode[解码输出]
    end
    
    subgraph "响应处理"
        Decode --> Stream{流式输出?}
        Stream -->|是| ChunkResponse[分块响应]
        Stream -->|否| FullResponse[完整响应]
        ChunkResponse --> Format[格式化输出]
        FullResponse --> Format
        Format --> Output[客户端输出]
    end
    
    subgraph "资源管理"
        Generate --> Monitor[资源监控]
        Monitor --> Cleanup{需要清理?}
        Cleanup -->|是| Unload[卸载模型]
        Cleanup -->|否| Cache[保持缓存]
    end
```

数据流图展示了从用户输入到最终输出的完整处理链路，包括模型管理、推理计算和资源管理的并行处理机制。

## 技术栈总结

### 核心技术栈
- **语言**: Go (服务端), C++ (推理引擎)
- **网络**: HTTP/RESTful API, Gin框架
- **推理**: GGML, llama.cpp
- **并发**: Goroutines, Channels
- **硬件加速**: CUDA, ROCm, Metal, Vulkan

### 关键设计模式
1. **调度器模式**: 集中管理模型生命周期和资源分配
2. **适配器模式**: 统一不同硬件后端的接口
3. **观察者模式**: 流式输出和进度监控
4. **工厂模式**: 动态创建不同类型的运行器
5. **单例模式**: 全局设备发现和配置管理

### 性能优化特性
- **懒加载**: 按需加载模型到内存
- **引用计数**: 智能资源管理和自动清理
- **层级分割**: CPU/GPU混合推理优化
- **流式输出**: 减少首次响应时间
- **并发控制**: 信号量限制并发请求数

Ollama通过模块化的架构设计，实现了高性能、可扩展的本地大语言模型服务，支持多种硬件平台和模型格式，为用户提供了简洁易用的AI推理能力。