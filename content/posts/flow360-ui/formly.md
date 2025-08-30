# Formly 框架详解

## 概述

Formly 是一个动态表单生成框架，用于 Angular 应用程序。它允许开发者通过 JSON 配置来生成复杂的表单，而不需要编写大量的模板代码。

## 架构层面

### 1. 核心架构

```mermaid
graph TB
    A[JSON Schema] --> B[Formly Generator]
    B --> C[Field Type Registry]
    C --> D[Custom Field Components]
    B --> E[Form Group]
    E --> F[Angular Reactive Forms]
    
    G[Formly Config] --> C
    H[Validators] --> B
    I[Wrappers] --> B
    J[Extensions] --> B
    
    subgraph "Formly Core"
        B
        C
        E
    end
    
    subgraph "Custom Components"
        D
        K[Vector Field]
        L[Expression Field]
        M[Entity Select Field]
    end
    
    D --> K
    D --> L
    D --> M
```

### 2. 数据流架构

```mermaid
sequenceDiagram
    participant Schema as JSON Schema
    participant Generator as Formly Generator
    participant Registry as Field Registry
    participant Component as Field Component
    participant Form as Angular Form
    participant Model as Data Model
    
    Schema->>Generator: 提供字段配置
    Generator->>Registry: 查询字段类型
    Registry->>Component: 返回组件类
    Generator->>Component: 创建字段实例
    Component->>Form: 绑定表单控件
    Form->>Model: 数据双向绑定
    Model->>Component: 更新视图
```

### 3. 扩展架构

```mermaid
graph LR
    A[Formly Core] --> B[Field Types]
    A --> C[Wrappers]
    A --> D[Extensions]
    A --> E[Validators]
    
    B --> F[Built-in Types]
    B --> G[Custom Types]
    
    F --> H[input]
    F --> I[select]
    F --> J[checkbox]
    
    G --> K[vector]
    G --> L[valueWithUnit]
    G --> M[entitySelect]
    G --> N[autoIncrementInput]
    
    C --> O[Label Wrapper]
    C --> P[Description Wrapper]
    C --> Q[Validation Wrapper]
    
    D --> R[Core Extension]
    D --> S[Validation Extension]
    D --> T[Field Expression Extension]
```

## 使用层面

### 1. 基本使用流程

```mermaid
flowchart TD
    A[定义 JSON Schema] --> B[配置 Field Types]
    B --> C[创建 Form Group]
    C --> D[渲染 Formly Form]
    D --> E[用户交互]
    E --> F[数据验证]
    F --> G[提交数据]
    
    E --> H[字段值变化]
    H --> I[触发 modelChange]
    I --> J[更新数据模型]
    J --> K[响应式更新其他字段]
```

### 2. 字段类型使用

```mermaid
graph TB
    A[Schema Definition] --> B{Field Type}
    
    B --> C[Primitive Types]
    B --> D[Custom Types]
    B --> E[Business Types]
    
    C --> F[string → input]
    C --> G[number → inputNumber]
    C --> H[boolean → checkbox]
    C --> I[array → multiselect]
    
    D --> J[vector → VectorComponent]
    D --> K[valueWithUnit → ValueWithUnitComponent]
    D --> L[expression → ExpressionComponent]
    
    E --> M[entitySelect → EntitySelectComponent]
    E --> N[turbulenceQuantities → TurbulenceComponent]
    E --> O[projectionArea → ProjectionAreaComponent]
```

### 3. 表单配置层次

```mermaid
graph TB
    A[Application Level] --> B[FormlyModule.forRoot]
    B --> C[Global Configuration]
    C --> D[Field Types Registry]
    C --> E[Validators Registry]
    C --> F[Wrappers Registry]
    
    G[Component Level] --> H[FormlyForm Component]
    H --> I[Schema Input]
    H --> J[Model Input]
    H --> K[Form Group]
    
    L[Field Level] --> M[Field Configuration]
    M --> N[Type]
    M --> O[Key]
    M --> P[Props]
    M --> Q[Validators]
    M --> R[Expressions]
```

## 三个核心包详解

### @ngx-formly/core (^6.3.1)

**功能说明：**
- Formly 的核心库，提供基础架构和 API
- 包含字段类型注册、表单生成、验证等核心功能

**核心组件：**

```mermaid
graph TB
    A["@ngx-formly/core"] --> B[FormlyModule]
    A --> C[FormlyForm Component]
    A --> D[FieldType Base Class]
    A --> E[FormlyJsonschema]
    A --> F[FormlyConfig Service]
    
    B --> G["forRoot - 全局配置"]
    B --> H["forChild - 模块配置"]
    
    C --> I[字段渲染引擎]
    C --> J[数据绑定管理]
    
    D --> K[自定义字段基类]
    D --> L[生命周期钩子]
    
    E --> M["JSON Schema 转换器"]
    E --> N[字段配置生成器]
    
    F --> O[类型注册管理]
    F --> P[验证器管理]
    F --> Q[包装器管理]
```

**主要 API：**
- `FormlyFieldConfig`: 字段配置接口
- `FieldType<T>`: 自定义字段基类
- `FormlyJsonschema`: JSON Schema 转换服务

### @ngx-formly/ng-zorro-antd (^6.3.1)

**功能说明：**
- 提供基于 Ng-Zorro-Antd 的预定义字段类型
- 与 Ant Design 样式系统集成

**提供的字段类型：**

```mermaid
graph TB
    A["@ngx-formly/ng-zorro-antd"] --> B[Input Fields]
    A --> C[Selection Fields]
    A --> D[Layout Fields]
    A --> E[Data Fields]
    
    B --> F["input - 文本输入"]
    B --> G["textarea - 多行文本"]
    B --> H["number - 数字输入"]
    
    C --> I["select - 下拉选择"]
    C --> J["radio - 单选按钮"]
    C --> K["checkbox - 复选框"]
    
    D --> L["tabs - 标签页"]
    D --> M["card - 卡片布局"]
    D --> N["divider - 分割线"]
    
    E --> O["datepicker - 日期选择"]
    E --> P["slider - 滑动条"]
    E --> Q["rate - 评分"]
```

**样式集成：**
- 自动应用 Ant Design 主题
- 支持响应式布局
- 内置验证错误样式

### @ngx-formly/schematics (6.3.1)

**功能说明：**
- 提供 Angular CLI 脚手架工具
- 快速生成 Formly 相关代码

**提供的脚手架：**

```mermaid
graph TB
    A["@ngx-formly/schematics"] --> B["ng add @ngx-formly/schematics"]
    A --> C["ng generate field"]
    A --> D["ng generate wrapper"]
    A --> E["ng generate extension"]
    
    B --> F[自动安装依赖]
    B --> G[配置模块导入]
    B --> H[生成示例代码]
    
    C --> I[创建自定义字段]
    C --> J[注册字段类型]
    C --> K[生成测试文件]
    
    D --> L[创建字段包装器]
    D --> M[配置包装器样式]
    
    E --> N["创建 Formly 扩展"]
    E --> O[注册扩展功能]
```

**使用命令：**
```bash
# 安装 Formly
ng add @ngx-formly/schematics

# 生成自定义字段
ng generate @ngx-formly/schematics:field --name=auto-increment-input

# 生成包装器
ng generate @ngx-formly/schematics:wrapper --name=custom-wrapper
```

## Flow360 项目中的 Formly 使用

### 1. 项目架构集成

```mermaid
graph TB
    A[Flow360 Application] --> B[FormlyGeneratorComponent]
    B --> C[Business Components]
    B --> D[Custom Fields]
    B --> E[Standard Fields]
    
    C --> F[TurbulenceQuantities]
    C --> G[ProjectionArea]
    C --> H[EntitySelect]
    
    D --> I[Vector Field]
    D --> J[ValueWithUnit Field]
    D --> K[Expression Field]
    D --> L[Matrix Window Field]
    
    E --> M[Ng-Zorro-Antd Fields]
    
    N[JSON Schema] --> B
    O[Data Model] --> B
    B --> P[Angular Reactive Forms]
```

### 2. 自定义字段扩展流程

```mermaid
flowchart TD
    A[需求分析] --> B[定义字段类型]
    B --> C[创建组件文件]
    C --> D[实现 FieldType 接口]
    D --> E[配置字段属性]
    E --> F[注册到 FormlyConfig]
    F --> G[在 Generator 中处理]
    G --> H[编写测试]
    H --> I[文档更新]
    
    D --> J[模板定义]
    D --> K[样式定义]
    D --> L[逻辑实现]
    
    J --> M[数据绑定]
    K --> N[主题适配]
    L --> O[验证逻辑]
    L --> P[事件处理]
```

### 3. 数据流管理

```mermaid
sequenceDiagram
    participant User as 用户操作
    participant Field as 字段组件
    participant Form as 表单控件
    participant Generator as FormlyGenerator
    participant Parent as 父组件
    
    User->>Field: 输入数据
    Field->>Form: 更新 FormControl
    Form->>Generator: 触发 valueChanges
    Generator->>Parent: 发出 modelChange
    Parent->>Generator: 更新 model
    Generator->>Field: 响应式更新
    Field->>User: 更新界面显示
```

## 最佳实践

### 1. 字段开发原则
- 遵循单一职责原则
- 保持组件无状态（依赖 FormControl）
- 正确处理 disabled 状态
- 实现适当的验证逻辑

### 2. 性能优化
- 使用 OnPush 变更检测策略
- 适当使用 trackBy 函数
- 避免在模板中使用复杂表达式
- 合理使用 async 管道

### 3. 测试策略
- 单元测试：测试字段组件逻辑
- 集成测试：测试与 Formly 的集成
- E2E 测试：测试完整的用户交互流程
