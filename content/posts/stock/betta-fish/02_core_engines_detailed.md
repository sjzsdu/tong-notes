# BettaFish 核心引擎模块详解

## 模块概述

BettaFish项目的核心由5个专业化的AI Agent引擎组成，每个引擎都采用相似的架构模式但针对不同的业务场景进行了优化。

## Engine模块通用架构

```mermaid
classDiagram
    class BaseNode {
        <<abstract>>
        +LLMClient llm_client
        +str node_name
        +run(input_data, **kwargs)*
    }
    
    class DeepSearchAgent {
        +Config config
        +LLMClient llm_client
        +State state
        +SearchTool search_tool
        +initialize_llm()
        +initialize_nodes()
        +deep_search(query, max_iterations)
        +export_report()
    }
    
    class State {
        +str original_query
        +List~Search~ searches
        +str report_structure
        +str final_report
        +to_dict()
        +from_dict()
        +save_to_file()
    }
    
    class LLMClient {
        +str api_key
        +str base_url
        +str model_name
        +generate_response(prompt)
        +generate_streaming_response(prompt)
    }
    
    BaseNode <|-- ReportStructureNode
    BaseNode <|-- FirstSearchNode
    BaseNode <|-- ReflectionNode
    BaseNode <|-- FirstSummaryNode
    BaseNode <|-- ReflectionSummaryNode
    BaseNode <|-- ReportFormattingNode
    
    DeepSearchAgent --> State
    DeepSearchAgent --> LLMClient
    DeepSearchAgent --> BaseNode
    
    State --> Search
    
    class Search {
        +str query
        +str url
        +str title
        +str content
        +float score
        +str timestamp
    }
```

**通用架构说明：**
所有Engine都遵循相同的设计模式：DeepSearchAgent作为主控制器，管理State状态对象，通过LLMClient与AI服务交互，使用多个专业化的Node节点执行具体任务。BaseNode定义了节点的统一接口，各个具体Node实现特定的处理逻辑。State对象管理整个搜索和分析过程的状态数据。

## InsightEngine（洞察引擎）

### 功能架构

```mermaid
graph TB
    subgraph "InsightEngine核心组件"
        ISA[InsightEngine Agent]
        
        subgraph "处理节点"
            RSN1[ReportStructureNode<br/>报告结构规划]
            FSN1[FirstSearchNode<br/>初始搜索]
            RN1[ReflectionNode<br/>搜索反思优化]  
            FSuN1[FirstSummaryNode<br/>初步总结]
            RSuN1[ReflectionSummaryNode<br/>深度总结]
            RFN1[ReportFormattingNode<br/>报告格式化]
        end
        
        subgraph "数据工具"
            MDB[MediaCrawlerDB<br/>本地数据库搜索]
            KO1[KeywordOptimizer<br/>关键词优化]
            SA1[SentimentAnalyzer<br/>情感分析]
        end
        
        subgraph "LLM服务"
            MOONSHOT[Moonshot AI<br/>32K上下文]
        end
    end
    
    ISA --> RSN1 --> FSN1 --> RN1 --> FSuN1 --> RSuN1 --> RFN1
    FSN1 --> MDB
    RN1 --> MDB
    FSN1 --> KO1
    RN1 --> SA1
    
    RSN1 --> MOONSHOT
    FSN1 --> MOONSHOT
    RN1 --> MOONSHOT
    FSuN1 --> MOONSHOT
    RSuN1 --> MOONSHOT
    RFN1 --> MOONSHOT
    
    style ISA fill:#e1f5fe
    style MDB fill:#fff3e0
    style MOONSHOT fill:#f3e5f5
```

**InsightEngine架构说明：**
InsightEngine专注于本地数据库的深度洞察分析。工作流程从报告结构规划开始，通过初始搜索获取相关数据，经过反思优化改进搜索策略，然后进行多层次总结，最终生成格式化报告。核心依赖MediaCrawlerDB进行数据检索，使用关键词优化和情感分析提升分析质量。

### 核心特性
- **智能热度计算**：综合点赞、评论、分享等指标计算内容热度
- **多维度搜索**：支持话题搜索、时间范围搜索、平台特定搜索
- **情感分析**：集成多语言情感分析模型
- **反思机制**：通过反思节点优化搜索策略和结果质量

## MediaEngine（媒体引擎）

### 功能架构

```mermaid
graph TB
    subgraph "MediaEngine核心组件"
        MEA[MediaEngine Agent]
        
        subgraph "处理节点"
            RSN2[ReportStructureNode<br/>报告结构规划]
            FSN2[FirstSearchNode<br/>多模态搜索]
            RN2[ReflectionNode<br/>搜索反思优化]
            FSuN2[FirstSummaryNode<br/>媒体内容总结]
            RSuN2[ReflectionSummaryNode<br/>深度媒体分析]
            RFN2[ReportFormattingNode<br/>报告格式化]
        end
        
        subgraph "搜索工具"
            BOCHA[BochaMultimodalSearch<br/>多模态搜索API]
        end
        
        subgraph "LLM服务"
            GEMINI[Gemini 2.0 Flash<br/>多模态理解]
        end
    end
    
    MEA --> RSN2 --> FSN2 --> RN2 --> FSuN2 --> RSuN2 --> RFN2
    FSN2 --> BOCHA
    RN2 --> BOCHA
    
    RSN2 --> GEMINI
    FSN2 --> GEMINI
    RN2 --> GEMINI
    FSuN2 --> GEMINI
    RSuN2 --> GEMINI
    RFN2 --> GEMINI
    
    style MEA fill:#f3e5f5
    style BOCHA fill:#e8f5e8
    style GEMINI fill:#fff3e0
```

**MediaEngine架构说明：**
MediaEngine专门处理多模态媒体内容分析，通过博查API获取图文视频等全媒体数据。采用Gemini 2.0作为LLM服务，利用其强大的多模态理解能力分析各种媒体内容。工作流程与其他Engine相似，但针对多媒体数据进行了优化。

### 核心特性
- **多模态搜索**：支持文本、图片、视频内容的统一搜索
- **实时媒体监控**：基于博查API的实时媒体内容追踪
- **跨平台整合**：整合多个媒体平台的内容数据
- **视觉内容理解**：利用AI模型理解图片和视频内容

## QueryEngine（查询引擎）

### 功能架构

```mermaid
graph TB
    subgraph "QueryEngine核心组件"
        QEA[QueryEngine Agent]
        
        subgraph "处理节点"
            RSN3[ReportStructureNode<br/>查询结构规划]
            FSN3[FirstSearchNode<br/>网络搜索]
            RN3[ReflectionNode<br/>搜索策略优化]
            FSuN3[FirstSummaryNode<br/>搜索结果总结]
            RSuN3[ReflectionSummaryNode<br/>深度信息分析]
            RFN3[ReportFormattingNode<br/>报告格式化]
        end
        
        subgraph "搜索工具"
            TAVILY[TavilyNewsAgency<br/>实时新闻搜索]
        end
        
        subgraph "LLM服务"
            DEEPSEEK[DeepSeek Reasoner<br/>推理能力增强]
        end
    end
    
    QEA --> RSN3 --> FSN3 --> RN3 --> FSuN3 --> RSuN3 --> RFN3
    FSN3 --> TAVILY
    RN3 --> TAVILY
    
    RSN3 --> DEEPSEEK
    FSN3 --> DEEPSEEK
    RN3 --> DEEPSEEK
    FSuN3 --> DEEPSEEK
    RSuN3 --> DEEPSEEK
    RFN3 --> DEEPSEEK
    
    style QEA fill:#e8f5e8
    style TAVILY fill:#e1f5fe
    style DEEPSEEK fill:#f3e5f5
```

**QueryEngine架构说明：**
QueryEngine专注于实时网络搜索和信息检索，通过Tavily API获取最新的网络资讯。使用DeepSeek Reasoner作为LLM服务，利用其强大的推理能力对搜索结果进行深度分析和推理。特别适合处理需要实时信息和逻辑推理的查询任务。

### 核心特性
- **实时搜索**：基于Tavily API的全网实时搜索能力
- **新闻热点追踪**：专门针对新闻和热点事件的追踪分析
- **逻辑推理**：利用DeepSeek的推理能力进行深度分析
- **信息验证**：通过多源信息交叉验证提升结果可信度

## ReportEngine（报告引擎）

### 功能架构

```mermaid
graph TB
    subgraph "ReportEngine核心组件"
        REA[ReportEngine Agent]
        
        subgraph "处理节点"
            TSN[TemplateSelectionNode<br/>模板选择]
            HGN[HTMLGenerationNode<br/>HTML生成]
        end
        
        subgraph "管理组件"
            FCB[FileCountBaseline<br/>文件基准管理]
            RS[ReportState<br/>报告状态管理]
        end
        
        subgraph "LLM服务"
            GEMINI_R[Gemini 2.0 Flash<br/>报告生成]
        end
        
        subgraph "输出管理"
            HTML[HTML报告文件]
            JSON[状态JSON文件]
            TEMPLATE[报告模板库]
        end
    end
    
    REA --> FCB
    REA --> TSN --> HGN
    REA --> RS
    
    TSN --> TEMPLATE
    HGN --> HTML
    RS --> JSON
    
    TSN --> GEMINI_R
    HGN --> GEMINI_R
    
    FCB --> JSON
    
    style REA fill:#fff3e0
    style HTML fill:#e8f5e8
    style GEMINI_R fill:#f3e5f5
```

**ReportEngine架构说明：**
ReportEngine专门负责报告的生成和格式化工作。通过模板选择节点选择合适的报告模板，HTML生成节点负责将分析结果转换为结构化的HTML报告。FileCountBaseline组件管理文件版本和基准，ReportState管理报告生成过程的状态。支持多种报告模板和自定义格式。

### 核心特性
- **模板化生成**：支持多种预定义报告模板
- **HTML格式输出**：生成结构化的HTML报告文件
- **版本管理**：自动管理报告版本和文件基准
- **状态追踪**：完整记录报告生成过程和状态

## 状态管理系统

```mermaid
stateDiagram-v2
    [*] --> Initialized: 引擎初始化
    
    Initialized --> StructurePlanning: 开始搜索任务
    StructurePlanning --> Searching: 规划完成
    
    Searching --> Reflecting: 初始搜索完成
    Reflecting --> Searching: 需要更多搜索
    Reflecting --> Summarizing: 搜索充分
    
    Summarizing --> DeepSummarizing: 初步总结完成
    DeepSummarizing --> Formatting: 深度总结完成
    
    Formatting --> Completed: 报告格式化完成
    Completed --> [*]: 任务结束
    
    state Searching {
        [*] --> QueryOptimization
        QueryOptimization --> DataRetrieval
        DataRetrieval --> ResultProcessing
        ResultProcessing --> [*]
    }
    
    state Summarizing {
        [*] --> ContentAnalysis
        ContentAnalysis --> SentimentAnalysis
        SentimentAnalysis --> KeyInsights
        KeyInsights --> [*]
    }
```

**状态管理说明：**
系统采用状态机模式管理整个分析流程。从初始化开始，经过结构规划、搜索、反思、总结、深度总结和格式化等阶段，每个阶段都有明确的状态转换条件。搜索和总结阶段内部还有子状态，确保处理过程的完整性和可追溯性。

## 通信与协作机制

```mermaid
sequenceDiagram
    participant User as 用户
    participant Flask as Flask主应用
    participant Engine as 选定Engine
    participant LLM as LLM服务
    participant Tools as 外部工具
    participant DB as 数据存储
    
    User->>Flask: 提交查询请求
    Flask->>Engine: 初始化Agent
    Engine->>Engine: 加载配置和状态
    
    loop 搜索和分析循环
        Engine->>Tools: 调用搜索工具
        Tools-->>Engine: 返回搜索结果
        Engine->>LLM: 请求AI分析
        LLM-->>Engine: 返回分析结果
        Engine->>Engine: 更新状态
    end
    
    Engine->>DB: 保存状态和结果
    Engine->>Flask: 返回分析报告
    Flask-->>User: 展示报告结果
```

**通信协作说明：**
系统采用事件驱动的通信模式。用户请求通过Flask主应用路由到对应的Engine，Engine内部通过状态管理协调各个Node的执行，与外部LLM服务和搜索工具进行异步通信，最终将结果返回给用户。整个过程支持实时状态更新和进度追踪。