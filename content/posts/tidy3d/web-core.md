---
title: "Tidy3D Web Core模块架构解析"
date: ""
lastmod: "2025-06-17"
draft: false
author: 孙巨中
description: "深入解析Tidy3D电磁仿真软件的Web Core模块架构设计，包括云服务交互、任务管理和环境配置的实现原理"
keywords: ["Tidy3D", "Web Core", "云计算", "电磁仿真", "任务管理", "HTTP通信", "环境配置", "计算电磁学"]
tags: ["云服务", "计算电磁学", "软件架构", "API设计", "科学计算", "Python"]
categories: ["Tidy3D"]
weight: 8200
series: ["Tidy3D系列"]
showInHome: true
license: "CC BY-NC-ND"
featured_image: ""
summary: "本文详细解析了Tidy3D电磁仿真软件的Web Core模块架构，包括资源管理、任务处理、环境配置、HTTP通信和文件处理等核心组件的实现原理和设计优势。"
---
# Tidy3D Web Core 模块分析

1. 类图

```mermaid
classDiagram
    %% 基础抽象类
    class BaseModel {
        <<Pydantic>>
    }
    class ABC {
        <<Abstract>>
    }
    
    %% 核心抽象类
    class Tidy3DResource {
        <<Abstract>>
        +get()*
    }
    class ResourceLifecycle {
        <<Abstract>>
        +create()*
        +delete()*
    }
    class Submittable {
        <<Abstract>>
        +submit()*
    }
    class Queryable {
        <<Abstract>>
        +list()*
    }
    
    %% 任务相关类
    class TaskBase {
        <<Abstract>>
        +Config
    }
    class TaskInfo {
        +taskId: str
        +taskName: str
        +nodeSize: int
        +completedAt: datetime
        +status: str
        +realCost: float
        +timeSteps: int
        +solverVersion: str
        +createAt: datetime
        +estCostMin: float
        +estCostMax: float
        +realFlexUnit: float
        +oriRealFlexUnit: float
        +estFlexUnit: float
        +estFlexCreditTimeStepping: float
        +estFlexCreditPostProcess: float
        +estFlexCreditMode: float
        +s3Storage: float
        +startSolverTime: datetime
        +finishSolverTime: datetime
        +totalSolverTime: int
        +callbackUrl: str
        +taskType: str
        +metadataStatus: str
        +taskBlockInfo: TaskBlockInfo
    }
    class RunInfo {
        +perc_done: float
        +field_decay: float
        +display()
    }
    class TaskBlockInfo {
        +chargeType: ChargeType
        +maxFreeCount: int
        +maxGridPoints: int
        +maxTimeSteps: int
    }
    
    %% 文件夹和任务类
    class Folder {
        +folder_id: str
        +folder_name: str
        +list()
        +get(folder_name, create)
        +create(folder_name)
        +delete()
        +delete_old(days_old)
        +list_tasks()
    }
    class SimulationTask {
        +task_id: str
        +folder_id: str
        +status: str
        +real_flex_unit: float
        +created_at: datetime
        +task_type: str
        +folder_name: str
        +callback_url: str
        +create(task_type, task_name, folder_name, callback_url, simulation_type, parent_tasks, file_type)
        +get(task_id, verbose)
        +get_running_tasks()
        +delete(versions)
        +get_simulation_json(to_file, verbose)
        +upload_simulation(stub, verbose, progress_callback, remote_sim_file)
        +upload_file(local_file, remote_filename, verbose, progress_callback)
        +submit(solver_version, worker_group, pay_type)
        +estimate_cost(solver_version)
        +get_sim_data_hdf5(to_file, verbose, progress_callback, remote_data_file)
        +get_simulation_hdf5(to_file, verbose, progress_callback, remote_sim_file)
        +get_running_info()
        +get_log(to_file, verbose, progress_callback)
        +get_error_json(to_file, verbose)
        +abort()
    }
    
    %% 账户类
    class Account {
        +allowance_cycle_type: str
        +credit: float
        +credit_expiration: datetime
        +allowance_current_cycle_amount: float
        +allowance_current_cycle_end_date: datetime
        +daily_free_simulation_counts: int
    }
    
    %% 环境配置类
    class EnvironmentConfig {
        +name: str
        +web_api_endpoint: str
        +website_endpoint: str
        +s3_region: str
        +ssl_verify: bool
        +enable_caching: bool
        +ssl_version: ssl.TLSVersion
        +active()
        +get_real_url(path)
    }
    class Environment {
        +env_map
        +current: EnvironmentConfig
        +dev: EnvironmentConfig
        +uat: EnvironmentConfig
        +pre: EnvironmentConfig
        +prod: EnvironmentConfig
        +set_current(config)
        +enable_caching(enable_caching)
        +set_ssl_version(ssl_version)
    }
    
    %% HTTP工具类
    class HttpSessionManager {
        -session: requests.Session
        +reinit()
        +get(path, json, params)
        +post(path, json)
        +put(path, json, files)
        +delete(path, json, params)
    }
    
    %% 枚举类
    class TaskStatus {
        <<Enum>>
        INIT
        QUEUE
        PRE
        RUN
        POST
        SUCCESS
        ERROR
    }
    class ChargeType {
        <<Enum>>
        FREE
        PAID
    }
    class TaskType {
        <<Enum>>
        FDTD
        MODE_SOLVER
        HEAT
        HEAT_CHARGE
        EME
        MODE
    }
    class PayType {
        <<Enum>>
        CREDITS
        AUTO
    }
    class ResponseCodes {
        <<Enum>>
        UNAUTHORIZED
        OK
        NOT_FOUND
    }
    
    %% 继承关系
    BaseModel <|-- Tidy3DResource
    ABC <|-- Tidy3DResource
    Tidy3DResource <|-- ResourceLifecycle
    ABC <|-- ResourceLifecycle
    BaseModel <|-- Submittable
    ABC <|-- Submittable
    BaseModel <|-- Queryable
    ABC <|-- Queryable
    
    BaseModel <|-- TaskBase
    ABC <|-- TaskBase
    TaskBase <|-- TaskInfo
    TaskBase <|-- RunInfo
    TaskBase <|-- TaskBlockInfo
    
    Tidy3DResource <|-- Folder
    Queryable <|-- Folder
    ResourceLifecycle <|-- SimulationTask
    Submittable <|-- SimulationTask
    
    Tidy3DResource <|-- Account
    
    BaseModel <|-- EnvironmentConfig
```

2. 任务处理流程图

```mermaid
flowchart TD
    A[开始] --> B[创建文件夹 Folder.create]
    B --> C[创建任务 SimulationTask.create]
    C --> D[上传模拟数据 upload_simulation]
    D --> E[提交任务 submit]
    E --> F{任务状态检查}
    F -->|运行中| G[获取运行信息 get_running_info]
    G --> F
    F -->|成功| H[获取模拟数据 get_sim_data_hdf5]
    F -->|错误| I[获取错误信息 get_error_json]
    F -->|取消| J[结束]
    H --> K[结束]
    I --> L[结束]
```

3. 环境配置流程图
```mermaid
flowchart TD
    A[开始] --> B{检查环境变量 TIDY3D_ENV}
    B -->|存在| C{环境变量值}
    B -->|不存在| D[使用生产环境 prod]
    C -->|dev| E[使用开发环境 dev]
    C -->|uat| F[使用测试环境 uat]
    C -->|prod| G[使用生产环境 prod]
    C -->|其他| H[警告并使用生产环境 prod]
    E --> I[设置当前环境 set_current]
    F --> I
    G --> I
    H --> I
    D --> I
    I --> J[结束]
```

4. HTTP请求处理泳道图
```mermaid
sequenceDiagram
    participant Client as 客户端
    participant HttpSessionManager as HTTP会话管理器
    participant Interceptor as HTTP拦截器
    participant Server as 服务器
    
    Client->>HttpSessionManager: 发起请求(get/post/put/delete)
    HttpSessionManager->>HttpSessionManager: reinit()
    HttpSessionManager->>Interceptor: 调用http_interceptor装饰的方法
    Interceptor->>HttpSessionManager: 添加认证信息(api_key_auth)
    HttpSessionManager->>Server: 发送HTTP请求
    Server-->>HttpSessionManager: 返回响应
    HttpSessionManager->>Interceptor: 处理响应
    Interceptor->>Interceptor: 检查状态码
    alt 状态码 != 200
        alt 状态码 == 404
            Interceptor-->>Client: 抛出WebNotFoundError
        else 其他错误
            Interceptor-->>Client: 抛出WebError
        end
    else 状态码 == 200
        Interceptor->>Interceptor: 解析JSON响应
        Interceptor->>Interceptor: 检查警告信息
        Interceptor-->>Client: 返回数据
    end
```

5. 任务生命周期泳道图
```mermaid
sequenceDiagram
    participant User as 用户
    participant Task as SimulationTask
    participant Server as 服务器
    participant S3 as S3存储
    
    User->>Task: create(task_type, task_name, folder_name)
    Task->>Server: 创建任务请求
    Server-->>Task: 返回任务ID和信息
    Task-->>User: 返回SimulationTask实例
    
    User->>Task: upload_simulation(stub)
    Task->>Task: 将模拟数据转换为HDF5格式
    Task->>S3: 上传模拟数据
    S3-->>Task: 上传完成
    
    User->>Task: submit(solver_version, worker_group, pay_type)
    Task->>Server: 提交任务请求
    Server-->>Task: 确认提交
    
    User->>Task: get_running_info()
    Task->>Server: 获取运行状态
    Server-->>Task: 返回进度和场衰减信息
    Task-->>User: 返回进度信息
    
    alt 任务成功
        User->>Task: get_sim_data_hdf5(to_file)
        Task->>S3: 下载模拟结果数据
        S3-->>Task: 返回数据
        Task-->>User: 保存到本地文件
    else 任务失败
        User->>Task: get_error_json(to_file)
        Task->>S3: 下载错误信息
        S3-->>Task: 返回错误数据
        Task-->>User: 保存到本地文件
    end
    
    User->>Task: delete()
    Task->>Server: 删除任务请求
    Server-->>Task: 确认删除
```

## 总结
Tidy3D Web Core 模块是一个用于与Tidy3D云服务进行交互的核心组件，主要功能包括：

1. 资源管理 ：通过抽象基类定义了资源的基本操作（获取、创建、删除、查询）
2. 任务处理 ：提供了创建、提交、监控和获取模拟任务结果的完整流程
3. 环境配置 ：支持多环境（开发、测试、生产）的灵活配置
4. HTTP通信 ：封装了与服务器的HTTP通信，包括认证、错误处理等
5. 文件处理 ：提供了文件压缩、上传、下载等功能
这些组件共同构成了一个完整的客户端SDK，使用户能够方便地使用Tidy3D的云计算服务进行电磁场模拟计算。