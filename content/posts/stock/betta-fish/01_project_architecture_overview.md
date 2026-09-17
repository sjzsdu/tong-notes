# BettaFish 项目架构概览

## 项目简介

BettaFish是一个基于多智能体（Multi-Agent）架构的舆情分析平台，集成了数据爬取、多维度搜索、情感分析和报告生成等功能。项目采用微服务架构，通过多个专业化的Engine模块协同工作，提供全面的舆情监控和分析服务。

## 系统架构图

```mermaid
graph TB
    subgraph "前端展示层"
        WEB[Web界面 - Flask]
        UI[Streamlit UI]
    end
    
    subgraph "核心引擎层"
        IE[InsightEngine<br/>洞察引擎]
        ME[MediaEngine<br/>媒体引擎] 
        QE[QueryEngine<br/>查询引擎]
        RE[ReportEngine<br/>报告引擎]
        FE[ForumEngine<br/>论坛引擎]
    end
    
    subgraph "数据采集层"
        MS[MindSpider<br/>智能爬虫]
        BTE[BroadTopicExtraction<br/>话题提取]
        DSC[DeepSentimentCrawling<br/>深度情感爬取]
    end
    
    subgraph "外部服务"
        LLM[多LLM服务<br/>Moonshot/Gemini/DeepSeek]
        TAVILY[Tavily搜索API]
        BOCHA[博查多模态搜索]
    end
    
    subgraph "数据存储"
        DB[(MySQL数据库<br/>舆情数据)]
        FILES[文件系统<br/>报告/状态]
    end
    
    subgraph "分析模型"
        SA[情感分析模型]
        TD[话题检测模型]
    end
    
    WEB --> IE
    WEB --> ME  
    WEB --> QE
    WEB --> RE
    UI --> IE
    UI --> ME
    UI --> QE
    
    IE --> LLM
    ME --> LLM
    QE --> LLM
    RE --> LLM
    FE --> LLM
    
    IE --> DB
    ME --> BOCHA
    QE --> TAVILY
    
    MS --> BTE
    MS --> DSC
    BTE --> DB
    DSC --> DB
    
    IE --> SA
    IE --> TD
    
    RE --> FILES
    IE --> FILES
    ME --> FILES
    QE --> FILES
    
    style IE fill:#e1f5fe
    style ME fill:#f3e5f5
    style QE fill:#e8f5e8
    style RE fill:#fff3e0
    style MS fill:#fce4ec
```

**系统架构说明：**
该架构图展示了BettaFish项目的分层设计。前端层提供用户交互界面，核心引擎层包含5个专业化的智能体模块，分别处理不同的业务场景。数据采集层负责从各种平台获取舆情数据，外部服务层集成多个AI和搜索服务，数据存储层管理结构化数据和文件，分析模型层提供AI能力支持。各层之间通过清晰的接口进行协作。

## 技术栈

```mermaid
mindmap
  root((BettaFish技术栈))
    Web框架
      Flask
      Streamlit
      Flask-SocketIO
    AI & LLM
      OpenAI API
      Moonshot API
      Gemini API
      DeepSeek API
    数据库
      MySQL
      pymysql
      SQLAlchemy
    爬虫技术
      异步爬虫
      多平台适配
      反爬策略
    搜索服务
      Tavily API
      博查多模态搜索
      本地数据库搜索
    前端技术
      HTML/CSS/JS
      WebSocket实时通信
      响应式设计
    开发工具
      Python 3.8+
      Docker容器化
      Git版本控制
    数据处理
      pandas
      numpy
      jieba分词
      正则表达式
```

**技术栈说明：**
该技术栈图以思维导图形式展示了项目使用的各种技术。Web框架层采用Flask作为后端服务，Streamlit提供交互式界面。AI层集成了多个大语言模型API，实现多样化的智能分析能力。数据层使用MySQL存储结构化数据。爬虫技术支持多平台数据采集，搜索服务提供多元化的信息检索能力。

## 核心模块概述

### 1. InsightEngine（洞察引擎）
- **功能**：基于本地数据库的深度洞察分析
- **特点**：智能热度计算、多维度搜索、情感分析
- **数据源**：本地MySQL舆情数据库

### 2. MediaEngine（媒体引擎）
- **功能**：基于博查API的多模态媒体内容搜索
- **特点**：图文视频全媒体分析、实时媒体监控
- **数据源**：博查多模态搜索API

### 3. QueryEngine（查询引擎）
- **功能**：基于Tavily的实时网络搜索
- **特点**：全网实时搜索、新闻热点追踪
- **数据源**：Tavily搜索API

### 4. ReportEngine（报告引擎）
- **功能**：智能报告生成和格式化
- **特点**：模板化报告、HTML格式输出、文件管理
- **输出**：结构化HTML报告

### 5. MindSpider（智能爬虫）
- **功能**：多平台数据采集和话题提取
- **特点**：AI驱动的智能爬虫、情感标注
- **覆盖平台**：微博、B站、知乎等主流社交媒体

## 项目文件结构

```mermaid
graph LR
    subgraph "项目根目录"
        APP[app.py - 主应用入口]
        CONFIG[config.py - 全局配置]
        REQ[requirements.txt - 依赖管理]
    end
    
    subgraph "核心引擎模块"
        IE_DIR[InsightEngine/]
        ME_DIR[MediaEngine/]
        QE_DIR[QueryEngine/]
        RE_DIR[ReportEngine/]
        FE_DIR[ForumEngine/]
    end
    
    subgraph "数据采集模块" 
        MS_DIR[MindSpider/]
        SAM_DIR[SentimentAnalysisModel/]
    end
    
    subgraph "前端资源"
        STATIC[static/ - 静态资源]
        TEMPLATES[templates/ - HTML模板]
    end
    
    subgraph "输出目录"
        REPORTS[各引擎报告目录/]
        LOGS[logs/ - 日志文件]
        TMP[tmp/ - 临时文件]
    end
    
    APP --> IE_DIR
    APP --> ME_DIR
    APP --> QE_DIR  
    APP --> RE_DIR
    CONFIG --> IE_DIR
    CONFIG --> ME_DIR
    CONFIG --> QE_DIR
    CONFIG --> RE_DIR
    
    MS_DIR --> SAM_DIR
    
    style APP fill:#ff9999
    style CONFIG fill:#99ff99
    style IE_DIR fill:#9999ff
    style ME_DIR fill:#ff99ff
    style QE_DIR fill:#99ffff
    style RE_DIR fill:#ffff99
```

**文件结构说明：**
该图展示了项目的模块化组织结构。app.py作为主入口统一管理所有引擎模块，config.py提供全局配置支持。各个Engine目录包含独立的智能体实现，MindSpider负责数据采集，前端资源目录支持Web界面，输出目录管理运行时产生的报告和日志文件。

## 系统特性

### 🚀 **多智能体协同**
- 5个专业化AI Agent各司其职
- 支持并行处理和任务协调
- 统一的状态管理和通信机制

### 🎯 **多模态数据处理** 
- 文本、图片、视频全媒体分析
- 跨平台数据整合能力
- 智能情感识别和话题检测

### 🔍 **多维度搜索引擎**
- 本地数据库深度搜索
- 实时网络信息检索  
- 多模态媒体内容搜索

### 📊 **智能报告生成**
- 自动化报告生成
- 可视化数据展示
- 多格式输出支持

### 🛡️ **高可扩展架构**
- 模块化设计便于扩展
- 容器化部署支持
- 多LLM服务集成

## 部署架构

```mermaid
graph TB
    subgraph "Docker容器部署"
        CONTAINER[BettaFish容器]
        MYSQL_CONTAINER[MySQL容器]
    end
    
    subgraph "外部API服务"
        MOONSHOT[Moonshot API]
        GEMINI[Gemini API] 
        DEEPSEEK[DeepSeek API]
        TAVILY_API[Tavily API]
        BOCHA_API[博查API]
    end
    
    subgraph "本地服务"
        FLASK_APP[Flask Web服务<br/>:5000]
        STREAMLIT_APPS[Streamlit应用集群<br/>:8501-8504]
    end
    
    USER[用户] --> FLASK_APP
    USER --> STREAMLIT_APPS
    
    FLASK_APP --> CONTAINER
    STREAMLIT_APPS --> CONTAINER
    
    CONTAINER --> MYSQL_CONTAINER
    CONTAINER --> MOONSHOT
    CONTAINER --> GEMINI
    CONTAINER --> DEEPSEEK  
    CONTAINER --> TAVILY_API
    CONTAINER --> BOCHA_API
    
    style CONTAINER fill:#e3f2fd
    style MYSQL_CONTAINER fill:#fff3e0
    style USER fill:#e8f5e8
```

**部署架构说明：**
系统支持Docker容器化部署，通过容器编排实现服务隔离和资源管理。Flask提供统一的Web入口，多个Streamlit应用提供专业化界面。系统通过API网关模式集成多个外部AI服务，确保高可用性和负载均衡。数据库采用独立容器部署，保障数据安全和性能。