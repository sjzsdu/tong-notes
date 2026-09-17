# BettaFish 数据流与业务时序分析

## 系统数据流概览

```mermaid
graph TB
    subgraph "数据采集层"
        WEIBO[微博数据]
        BILIBILI[B站数据] 
        ZHIHU[知乎数据]
        NEWS[新闻数据]
        FORUM[论坛数据]
    end
    
    subgraph "数据处理层"
        SPIDER[MindSpider<br/>智能爬虫]
        EXTRACT[话题提取<br/>BroadTopicExtraction]
        SENTIMENT[情感分析<br/>DeepSentimentCrawling]
    end
    
    subgraph "数据存储层"  
        MYSQL[(MySQL数据库<br/>结构化数据)]
        FILES[文件系统<br/>报告&状态]
    end
    
    subgraph "数据分析层"
        IE[InsightEngine<br/>本地数据洞察]
        ME[MediaEngine<br/>多模态分析]
        QE[QueryEngine<br/>实时搜索]
    end
    
    subgraph "数据展示层"
        RE[ReportEngine<br/>报告生成]
        WEB[Web界面]
        UI[Streamlit界面]
    end
    
    subgraph "外部数据源"
        TAVILY_DATA[Tavily搜索结果]
        BOCHA_DATA[博查多媒体数据]  
        LLM_DATA[LLM分析结果]
    end
    
    WEIBO --> SPIDER
    BILIBILI --> SPIDER  
    ZHIHU --> SPIDER
    NEWS --> SPIDER
    FORUM --> SPIDER
    
    SPIDER --> EXTRACT
    SPIDER --> SENTIMENT
    EXTRACT --> MYSQL
    SENTIMENT --> MYSQL
    
    IE --> MYSQL
    IE --> FILES
    
    ME --> BOCHA_DATA
    ME --> FILES
    
    QE --> TAVILY_DATA
    QE --> FILES
    
    IE --> LLM_DATA
    ME --> LLM_DATA
    QE --> LLM_DATA
    
    IE --> RE
    ME --> RE
    QE --> RE
    
    RE --> FILES
    RE --> WEB
    RE --> UI
    
    style MYSQL fill:#e1f5fe
    style FILES fill:#f3e5f5
    style LLM_DATA fill:#e8f5e8
```

**数据流说明：**
系统数据流分为五个层次：数据采集层收集各平台原始数据，数据处理层通过智能爬虫进行话题提取和情感分析，数据存储层管理结构化数据和文件，数据分析层通过三个Engine进行不同维度的分析，数据展示层生成报告并提供用户界面。整个流程支持实时数据处理和批量数据分析。

## 核心业务时序图

### 1. 完整舆情分析流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Flask as Flask主应用
    participant IE as InsightEngine
    participant ME as MediaEngine  
    participant QE as QueryEngine
    participant RE as ReportEngine
    participant DB as MySQL数据库
    participant API as 外部API服务
    
    Note over User,API: 完整舆情分析工作流
    
    User->>Flask: 提交舆情分析请求
    Flask->>IE: 启动洞察分析
    
    rect rgb(240, 248, 255)
        Note right of IE: InsightEngine工作流程
        IE->>IE: 1.规划报告结构
        IE->>DB: 2.搜索本地数据
        DB-->>IE: 返回相关数据
        IE->>API: 3.LLM分析处理
        API-->>IE: 返回分析结果
        IE->>IE: 4.反思和优化
        IE->>DB: 5.深度搜索
        IE->>IE: 6.生成洞察报告
    end
    
    IE->>Flask: 洞察分析完成
    Flask->>ME: 启动媒体分析
    
    rect rgb(248, 240, 255)
        Note right of ME: MediaEngine工作流程  
        ME->>API: 1.多模态搜索
        API-->>ME: 返回媒体数据
        ME->>API: 2.媒体内容分析
        ME->>ME: 3.跨平台数据整合
        ME->>ME: 4.生成媒体报告
    end
    
    ME->>Flask: 媒体分析完成
    Flask->>QE: 启动查询分析
    
    rect rgb(240, 255, 240)  
        Note right of QE: QueryEngine工作流程
        QE->>API: 1.实时网络搜索
        API-->>QE: 返回搜索结果
        QE->>API: 2.深度推理分析
        QE->>QE: 3.信息验证整合
        QE->>QE: 4.生成查询报告
    end
    
    QE->>Flask: 查询分析完成
    Flask->>RE: 启动报告整合
    
    rect rgb(255, 248, 240)
        Note right of RE: ReportEngine工作流程
        RE->>RE: 1.选择报告模板
        RE->>API: 2.整合多源数据
        RE->>RE: 3.生成HTML报告
        RE->>Flask: 4.返回最终报告
    end
    
    Flask-->>User: 返回综合舆情报告
```

**完整流程说明：**
该时序图展示了BettaFish系统进行完整舆情分析的全流程。用户请求通过Flask应用依次调用四个核心Engine，每个Engine专注不同的数据源和分析维度，最终由ReportEngine整合生成综合报告。整个过程采用顺序执行模式，确保数据的完整性和一致性。

### 2. 单Engine深度分析时序

```mermaid
sequenceDiagram
    participant User as 用户界面
    participant Agent as DeepSearchAgent
    participant Nodes as 处理节点集合
    participant LLM as LLM服务
    participant Tools as 外部工具
    participant State as 状态管理器
    
    Note over User,State: 单Engine深度分析详细流程
    
    User->>Agent: 发起深度搜索请求
    Agent->>State: 初始化状态对象
    
    rect rgb(245, 245, 245)
        Note over Agent,State: 第一阶段：结构规划
        Agent->>Nodes: 调用ReportStructureNode
        Nodes->>LLM: 请求报告结构规划
        LLM-->>Nodes: 返回结构化方案
        Nodes->>State: 更新报告结构
    end
    
    rect rgb(240, 248, 255)
        Note over Agent,State: 第二阶段：初始搜索
        Agent->>Nodes: 调用FirstSearchNode
        Nodes->>Tools: 执行搜索请求
        Tools-->>Nodes: 返回搜索结果
        Nodes->>LLM: 分析搜索内容
        LLM-->>Nodes: 返回分析结果
        Nodes->>State: 更新搜索结果
    end
    
    rect rgb(248, 240, 255)
        Note over Agent,State: 第三阶段：反思优化
        Agent->>Nodes: 调用ReflectionNode
        Nodes->>State: 读取当前结果
        Nodes->>LLM: 反思分析质量
        LLM-->>Nodes: 返回改进建议
        
        alt 需要更多搜索
            Nodes->>Tools: 执行优化搜索
            Tools-->>Nodes: 返回补充数据
            Nodes->>State: 更新搜索结果
        else 搜索结果充分
            Nodes->>State: 标记搜索完成
        end
    end
    
    rect rgb(240, 255, 240)
        Note over Agent,State: 第四阶段：内容总结
        Agent->>Nodes: 调用SummaryNodes
        Nodes->>LLM: 请求内容总结
        LLM-->>Nodes: 返回总结内容
        Nodes->>State: 更新总结结果
        
        Agent->>Nodes: 调用DeepSummaryNode
        Nodes->>LLM: 请求深度分析
        LLM-->>Nodes: 返回深度洞察
        Nodes->>State: 更新深度分析
    end
    
    rect rgb(255, 248, 240)
        Note over Agent,State: 第五阶段：报告格式化
        Agent->>Nodes: 调用FormattingNode
        Nodes->>State: 读取所有分析结果
        Nodes->>LLM: 请求格式化处理
        LLM-->>Nodes: 返回格式化报告
        Nodes->>State: 保存最终报告
    end
    
    Agent->>State: 导出完整报告
    State-->>User: 返回分析报告
```

**单Engine流程说明：**
该图详细展示了单个Engine内部的工作时序。每个阶段都有明确的职责：结构规划确定分析框架，初始搜索获取基础数据，反思优化提升分析质量，内容总结提取关键信息，报告格式化生成最终输出。整个过程通过State对象管理状态，支持断点续传和错误恢复。

## 数据存储与状态管理

### 数据存储架构

```mermaid
erDiagram
    USER ||--o{ SEARCH_TASK : creates
    SEARCH_TASK ||--o{ ENGINE_RUN : executes
    ENGINE_RUN ||--o{ SEARCH_RESULT : generates
    ENGINE_RUN ||--o{ ANALYSIS_REPORT : produces
    
    SEARCH_TASK {
        int task_id PK
        string query
        string task_type
        datetime created_at
        string status
        json parameters
    }
    
    ENGINE_RUN {
        int run_id PK
        int task_id FK
        string engine_type
        datetime start_time
        datetime end_time
        string status
        json state_data
    }
    
    SEARCH_RESULT {
        int result_id PK
        int run_id FK
        string source_type
        string content_title
        text content_body
        float relevance_score
        datetime publish_time
        json metadata
    }
    
    ANALYSIS_REPORT {
        int report_id PK
        int run_id FK
        string report_type
        text report_content
        string file_path
        datetime generated_at
        json statistics
    }
    
    CRAWLED_DATA {
        int data_id PK
        string platform
        string content_type
        text content
        string author
        datetime crawl_time
        json engagement_data
        float sentiment_score
    }
    
    TOPIC_EXTRACTION {
        int topic_id PK
        int data_id FK
        string topic_name
        float confidence
        json keywords
        datetime extracted_at
    }
    
    CRAWLED_DATA ||--o{ TOPIC_EXTRACTION : extracts
```

**数据存储说明：**
系统采用关系型数据库设计，支持用户任务管理、引擎执行跟踪、搜索结果存储和分析报告管理。同时维护爬取数据和话题提取的历史记录，实现数据的完整性和可追溯性。各表通过外键关联，支持复杂的数据查询和分析。

### 状态流转图

```mermaid
stateDiagram-v2
    [*] --> TaskCreated : 用户创建任务
    
    TaskCreated --> EngineInitialized : 初始化引擎
    EngineInitialized --> StructurePlanning : 开始结构规划
    
    StructurePlanning --> SearchPhase : 规划完成
    
    state SearchPhase {
        [*] --> FirstSearch : 开始搜索
        FirstSearch --> ReflectionCheck : 搜索完成
        
        ReflectionCheck --> AdditionalSearch : 需要更多数据
        ReflectionCheck --> SearchComplete : 数据充分
        
        AdditionalSearch --> ReflectionCheck : 继续评估
        SearchComplete --> [*] : 搜索阶段结束
    }
    
    SearchPhase --> AnalysisPhase : 进入分析阶段
    
    state AnalysisPhase {
        [*] --> InitialSummary : 初步总结
        InitialSummary --> DeepAnalysis : 深度分析
        DeepAnalysis --> QualityCheck : 质量检查
        
        QualityCheck --> Refinement : 需要改进
        QualityCheck --> AnalysisComplete : 分析完成
        
        Refinement --> DeepAnalysis : 重新分析
        AnalysisComplete --> [*] : 分析阶段结束
    }
    
    AnalysisPhase --> ReportGeneration : 生成报告
    ReportGeneration --> TaskCompleted : 任务完成
    TaskCompleted --> [*] : 流程结束
    
    note right of SearchPhase : 可能需要多轮搜索优化
    note right of AnalysisPhase : 确保分析质量和深度
    note right of ReportGeneration : 格式化输出和文件保存
```

**状态流转说明：**
系统采用状态机模式管理任务执行流程。从任务创建开始，经过引擎初始化、结构规划、搜索阶段、分析阶段和报告生成等步骤。搜索和分析阶段内部有子状态循环，支持迭代优化和质量控制。每个状态转换都有明确的条件和检查点。

## 实时数据流处理

```mermaid
graph TB
    subgraph "实时数据流"
        INPUT[用户输入] --> QUEUE[任务队列]
        QUEUE --> DISPATCHER[任务分发器]
        
        DISPATCHER --> ENGINE1[Engine实例1]
        DISPATCHER --> ENGINE2[Engine实例2] 
        DISPATCHER --> ENGINE3[Engine实例N]
        
        ENGINE1 --> PROCESSOR1[处理器1]
        ENGINE2 --> PROCESSOR2[处理器2]
        ENGINE3 --> PROCESSOR3[处理器N]
        
        PROCESSOR1 --> AGGREGATOR[结果聚合器]
        PROCESSOR2 --> AGGREGATOR
        PROCESSOR3 --> AGGREGATOR
        
        AGGREGATOR --> FORMATTER[格式化器]
        FORMATTER --> OUTPUT[输出结果]
    end
    
    subgraph "监控与管理"
        MONITOR[实时监控]
        LOGGER[日志记录]
        CACHE[缓存系统]
        
        MONITOR --> ENGINE1
        MONITOR --> ENGINE2
        MONITOR --> ENGINE3
        
        LOGGER --> PROCESSOR1
        LOGGER --> PROCESSOR2
        LOGGER --> PROCESSOR3
        
        CACHE --> AGGREGATOR
    end
    
    subgraph "外部服务"
        LLM_POOL[LLM服务池]
        SEARCH_POOL[搜索服务池]
        DB_POOL[数据库连接池]
        
        PROCESSOR1 --> LLM_POOL
        PROCESSOR2 --> SEARCH_POOL
        PROCESSOR3 --> DB_POOL
    end
    
    style QUEUE fill:#e1f5fe
    style AGGREGATOR fill:#e8f5e8
    style MONITOR fill:#fff3e0
```

**实时处理说明：**
系统支持实时数据流处理，通过任务队列和分发器实现负载均衡。多个Engine实例并行处理任务，结果通过聚合器统一收集。监控系统实时跟踪处理状态，日志记录支持问题诊断，缓存系统提升响应性能。外部服务池确保高并发处理能力。

## 数据一致性保障

```mermaid
graph TB
    subgraph "事务管理"
        TXN_START[事务开始]
        TXN_COMMIT[事务提交]
        TXN_ROLLBACK[事务回滚]
    end
    
    subgraph "数据校验"
        VALIDATION[数据验证]
        INTEGRITY[完整性检查]
        CONSISTENCY[一致性检查]
    end
    
    subgraph "错误处理"
        ERROR_DETECT[错误检测]
        ERROR_RECOVER[错误恢复]
        ERROR_REPORT[错误报告]
    end
    
    subgraph "状态同步"
        STATE_SYNC[状态同步]
        CHECKPOINT[检查点]
        RECOVERY[恢复机制]
    end
    
    TXN_START --> VALIDATION
    VALIDATION --> INTEGRITY
    INTEGRITY --> CONSISTENCY
    
    CONSISTENCY --> TXN_COMMIT
    CONSISTENCY --> ERROR_DETECT
    
    ERROR_DETECT --> ERROR_RECOVER
    ERROR_RECOVER --> TXN_ROLLBACK
    ERROR_DETECT --> ERROR_REPORT
    
    TXN_COMMIT --> STATE_SYNC
    STATE_SYNC --> CHECKPOINT
    
    TXN_ROLLBACK --> RECOVERY
    RECOVERY --> STATE_SYNC
    
    style TXN_COMMIT fill:#e8f5e8
    style TXN_ROLLBACK fill:#ffebee
    style ERROR_RECOVER fill:#fff3e0
```

**数据一致性说明：**
系统通过事务管理确保数据一致性，包含完整的验证、检查和错误处理机制。支持自动错误恢复和状态同步，通过检查点机制实现断点续传。在异常情况下能够自动回滚并恢复到安全状态，保障数据的完整性和系统的稳定性。