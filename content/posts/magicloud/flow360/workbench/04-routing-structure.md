# Workbench 路由结构分析文档

## 概述

本文档分析 Flow360 Workbench 的路由配置、页面导航结构和路由守卫机制。

## 路由配置图

### 1. 主路由结构

```mermaid
graph TD
    Root["根路径 /"] --> Workspaces["/workspaces"]
    Root --> Dashboard["/dashboard"]
    Root --> Examples["/examples"]
    Root --> Workbench["/workbench"]
    
    Workbench --> ProjectRoute["/workbench/:projectId"]
    Workbench --> PreloadRoute["/workbench/:projectId/preload"]
    Workbench --> Fallback["/workbench/**"]
    
    ProjectRoute --> |"主工作台"| WorkbenchComponent["WorkbenchComponent"]
    PreloadRoute --> |"预加载页"| WorkbenchPreloadComponent["WorkbenchPreloadComponent"]
    Fallback --> |"重定向"| Workspaces
    
    %% 查询参数
    ProjectRoute --> |"type=Draft"| DraftMode["草稿模式"]
    ProjectRoute --> |"type=Case"| CaseMode["案例模式"]
    ProjectRoute --> |"id=xxx"| ItemId["项目项ID"]
    ProjectRoute --> |"currentFolderId=xxx"| FolderId["文件夹ID"]
    
    style WorkbenchComponent fill:#e1f5fe
    style DraftMode fill:#fff3e0
    style CaseMode fill:#f3e5f5
```

**图表说明**: 这个路由结构图展现了 Workbench 在整个 Flow360 应用中的位置和内部路由设计：
- **主路由层级**: 从根路径分出workspaces、dashboard、examples和workbench四个主要模块
- **Workbench内部路由**: 包含项目主页面、预加载页面和失败重定向
- **查询参数控制**: 通过type、id、currentFolderId等参数控制工作台的具体显示模式
- **模式区分**: 蓝色表示主组件，橙色和紫色分别表示草稿编辑模式和案例查看模式
- 这种设计支持了灵活的页面状态管理和深度链接功能

### 2. 路由参数解析流程

```mermaid
sequenceDiagram
    participant Router as Angular Router
    participant ActivatedRoute as ActivatedRoute
    participant WorkbenchComponent as Workbench组件
    participant Services as 相关服务
    
    Router->>ActivatedRoute: 路由激活
    ActivatedRoute->>WorkbenchComponent: 传递路由参数
    
    Note over WorkbenchComponent: 解析路由参数
    WorkbenchComponent->>WorkbenchComponent: params = { projectId }
    WorkbenchComponent->>WorkbenchComponent: queryParams = { type, id, currentFolderId }
    
    WorkbenchComponent->>Services: 初始化项目数据
    Services->>WorkbenchComponent: 返回项目信息
    
    alt 草稿模式
        WorkbenchComponent->>WorkbenchComponent: 设置为编辑模式
        WorkbenchComponent->>Services: 加载草稿数据
    else 查看模式  
        WorkbenchComponent->>WorkbenchComponent: 设置为查看模式
        WorkbenchComponent->>Services: 加载案例数据
    end
    
    Services-->>WorkbenchComponent: 数据加载完成
    WorkbenchComponent->>WorkbenchComponent: 更新UI状态
```

### 3. 导航状态管理

```mermaid
stateDiagram-v2
    [*] --> RouteInit: 路由初始化
    RouteInit --> ParamsExtraction: 提取路由参数
    
    ParamsExtraction --> ProjectValidation: 验证项目ID
    ProjectValidation --> ProjectNotFound: 项目不存在
    ProjectValidation --> ProjectLoaded: 项目存在
    
    ProjectNotFound --> RedirectToWorkspaces: 重定向到工作空间
    
    ProjectLoaded --> ItemTypeCheck: 检查项目类型
    ItemTypeCheck --> DraftMode: type=Draft
    ItemTypeCheck --> CaseMode: type=Case  
    ItemTypeCheck --> DefaultMode: 无type参数
    
    DraftMode --> EditingState: 进入编辑状态
    CaseMode --> ViewingState: 进入查看状态
    DefaultMode --> AutoDetectMode: 自动检测模式
    
    EditingState --> SimulationEditing: 仿真参数编辑
    EditingState --> GeometryEditing: 几何体编辑
    
    ViewingState --> AnalysisViewing: 分析查看
    ViewingState --> ResultViewing: 结果查看
    
    AutoDetectMode --> DraftMode: 检测到草稿
    AutoDetectMode --> CaseMode: 检测到案例
```

**图表说明**: 这个导航状态管理图详细展示了路由激活后的状态转换流程：
- **初始化阶段**: 从路由初始化到参数提取，再到项目验证
- **错误处理**: 项目不存在时重定向到工作空间页面
- **模式判断**: 根据type参数决定进入草稿模式、案例模式或自动检测模式  
- **状态分化**: 不同模式进入相应的编辑或查看状态，支持多种操作类型
- **智能检测**: 无type参数时自动检测并选择合适的模式
- 这种状态机设计保证了路由处理的完整性和容错能力

## 路由相关组件

### 1. 路由配置文件

```typescript
// workbench.routes.ts
export const routes: Routes = [
  { path: ':projectId', component: WorkbenchComponent },
  { path: ':projectId/preload', component: WorkbenchPreloadComponent },
  {
    path: '**',
    redirectTo: '/workspaces',
  },
];
```

### 2. 路由参数处理

```mermaid
graph TB
    %% 路由参数来源
    URLParams["URL参数"] --> RouteParams["路由参数"]
    QueryString["查询字符串"] --> QueryParams["查询参数"]
    
    %% 参数处理
    RouteParams --> |"projectId"| ProjectId["项目ID"]
    QueryParams --> |"type"| ItemType["项目类型"]
    QueryParams --> |"id"| ItemId["项目项ID"]
    QueryParams --> |"currentFolderId"| FolderId["当前文件夹ID"]
    
    %% 参数验证和转换
    ProjectId --> ProjectValidation["项目验证"]
    ItemType --> TypeValidation["类型验证"]
    ItemId --> IdValidation["ID验证"]
    FolderId --> FolderValidation["文件夹验证"]
    
    %% 状态更新
    ProjectValidation --> StateUpdate["状态更新"]
    TypeValidation --> StateUpdate
    IdValidation --> StateUpdate
    FolderValidation --> StateUpdate
    
    StateUpdate --> ComponentInit["组件初始化"]
    
    style URLParams fill:#e3f2fd
    style StateUpdate fill:#fff3e0
    style ComponentInit fill:#f3e5f5
```

### 3. 导航操作流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as UI组件
    participant RouterUtil as 路由工具服务
    participant Router as Angular Router
    participant WorkbenchComponent as Workbench组件
    
    %% 用户发起导航
    User->>UI: 点击导航链接
    UI->>RouterUtil: 调用导航方法
    RouterUtil->>RouterUtil: 构建导航参数
    RouterUtil->>Router: navigate([path], { queryParams })
    
    %% 路由变化处理
    Router->>WorkbenchComponent: 路由激活
    WorkbenchComponent->>WorkbenchComponent: 监听路由变化
    WorkbenchComponent->>WorkbenchComponent: 更新内部状态
    
    %% 数据加载
    WorkbenchComponent->>WorkbenchComponent: 触发数据重新加载
    WorkbenchComponent-->>UI: 更新UI显示
    UI-->>User: 显示新页面内容
```

## 面包屑导航实现

### 1. 面包屑数据结构

```mermaid
graph LR
    BreadcrumbData[面包屑数据] --> ProjectLevel[项目层级]
    BreadcrumbData --> ItemPath[项目路径]
    
    ProjectLevel --> ProjectIcon[项目图标]
    ProjectLevel --> ProjectName[项目名称]
    ProjectLevel --> ProjectId[项目ID]
    
    ItemPath --> PathItems[路径项目列表]
    PathItems --> GeometryItem[几何体项]
    PathItems --> MeshItem[网格项]
    PathItems --> CaseItem[案例项]
    
    GeometryItem --> ItemIcon[项目图标]
    GeometryItem --> ItemName[项目名称]
    GeometryItem --> ItemType[项目类型] 
    GeometryItem --> ItemStatus[项目状态]
```

### 2. 面包屑导航逻辑

```mermaid
flowchart TD
    CurrentItem[当前项目] --> ItemType{项目类型}
    
    ItemType --> |Draft| DraftBreadcrumb[草稿面包屑]
    ItemType --> |Case/Geometry/Mesh| PathBreadcrumb[路径面包屑]
    
    DraftBreadcrumb --> DraftIcon[草稿图标]
    DraftBreadcrumb --> EditableName[可编辑名称]
    DraftBreadcrumb --> DraftActions[草稿操作]
    
    PathBreadcrumb --> PathQuery[查询路径数据]
    PathQuery --> PathItems[路径项目列表]
    PathItems --> LastItem[最后一项]
    LastItem --> ViewOnlyMode[仅查看模式]
    
    DraftActions --> RenameAction[重命名操作]
    DraftActions --> DeleteAction[删除操作]
    DraftActions --> RunAction[运行操作]
    
    ViewOnlyMode --> PathNavigation[路径导航]
    PathNavigation --> ParentNavigation[父级导航]
```

## 路由守卫机制

### 1. 权限验证流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Router as 路由器
    participant AuthGuard as 认证守卫
    participant ProjectGuard as 项目守卫
    participant Component as 组件
    
    User->>Router: 访问工作台路由
    Router->>AuthGuard: canActivate()
    AuthGuard->>AuthGuard: 检查用户认证状态
    
    alt 用户未认证
        AuthGuard-->>Router: false
        Router-->>User: 重定向到登录页
    else 用户已认证
        AuthGuard-->>Router: true
        Router->>ProjectGuard: canActivate()
        ProjectGuard->>ProjectGuard: 检查项目访问权限
        
        alt 无项目访问权限
            ProjectGuard-->>Router: false
            Router-->>User: 重定向到工作空间
        else 有项目访问权限
            ProjectGuard-->>Router: true
            Router->>Component: 激活组件
            Component-->>User: 显示工作台界面
        end
    end
```

### 2. 数据预加载机制

```mermaid
graph TD
    RouteActivation[路由激活] --> PreloadCheck{需要预加载?}
    
    PreloadCheck --> |是| PreloadComponent[预加载组件]
    PreloadCheck --> |否| MainComponent[主组件]
    
    PreloadComponent --> LoadingState[加载状态]
    LoadingState --> DataFetching[数据获取]
    DataFetching --> |成功| RedirectToMain[重定向到主组件]
    DataFetching --> |失败| ErrorHandling[错误处理]
    
    RedirectToMain --> MainComponent
    ErrorHandling --> ErrorPage[错误页面]
    
    MainComponent --> ComponentInit[组件初始化]
    ComponentInit --> RenderUI[渲染UI]
```

## URL 设计模式

### 1. RESTful 风格的URL结构

```
基础格式: /workbench/:projectId
查询参数: ?type=<ItemType>&id=<ItemId>&currentFolderId=<FolderId>

示例URLs:
- /workbench/proj_123                           # 项目默认视图
- /workbench/proj_123?type=Draft&id=draft_456   # 编辑草稿
- /workbench/proj_123?type=Case&id=case_789     # 查看案例
- /workbench/proj_123?currentFolderId=folder_abc # 指定文件夹上下文
```

### 2. URL状态同步

```mermaid
graph LR
    ApplicationState[应用状态] --> |同步| URLState[URL状态]
    URLState --> |解析| ApplicationState
    
    ApplicationState --> CurrentProject[当前项目]
    ApplicationState --> CurrentItem[当前项目]  
    ApplicationState --> ViewMode[查看模式]
    ApplicationState --> FolderContext[文件夹上下文]
    
    URLState --> ProjectIdParam[projectId参数]
    URLState --> TypeQuery[type查询参数]
    URLState --> IdQuery[id查询参数]
    URLState --> FolderQuery[currentFolderId查询参数]
    
    %% 双向同步
    CurrentProject -.-> ProjectIdParam
    CurrentItem -.-> TypeQuery
    CurrentItem -.-> IdQuery
    FolderContext -.-> FolderQuery
```

## 路由优化策略

### 1. 预加载策略
- **智能预加载**: 根据用户行为模式预加载可能访问的路由
- **数据预获取**: 在路由切换前预先获取必要数据
- **渐进式加载**: 优先加载关键数据，次要数据延迟加载

### 2. 缓存策略
- **路由级缓存**: 缓存路由解析结果
- **数据缓存**: 缓存API响应数据
- **状态保持**: 在路由切换时保持相关状态

### 3. 性能优化
- **懒加载**: 按需加载路由组件
- **代码分割**: 将大组件拆分为更小的块
- **预渲染**: 对静态内容进行预渲染

这种路由设计确保了良好的用户体验、清晰的URL结构和高效的页面导航。
