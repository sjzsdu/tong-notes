# 统一可视化框架 - 3D距离测量工具设计

## 📏 需求概述

本文档详细描述了在UVF框架中实现3D距离测量工具的技术设计方案。该工具允许用户在3D查看器中点击两个点来测量空间距离，并提供完整的测量数据面板和可视化展示。

## 🏗️ 整体架构设计

### 系统架构概览

```mermaid
graph TB
    subgraph "用户界面层 (UI Layer)"
        A1[测量工具按钮<br/>Measure Tool Button]
        A2[测量面板<br/>Measurement Panel]
        A3[3D查看器<br/>3D Viewer]
    end
    
    subgraph "控制器层 (Controller Layer)"
        B1[测量控制器<br/>MeasurementController]
        B2[交互控制器<br/>InteractionController]
        B3[几何控制器<br/>GeometryController]
    end
    
    subgraph "数据模型层 (Model Layer)"
        C1[测量实体<br/>MeasurementEntity]
        C2[测量状态<br/>MeasurementState]
        C3[3D点数据<br/>Point3D Data]
    end
    
    subgraph "渲染层 (Rendering Layer)"
        D1[测量线渲染器<br/>MeasurementLineRenderer]
        D2[测量文本渲染器<br/>MeasurementTextRenderer]
        D3[点捕捉渲染器<br/>PointSnapRenderer]
    end
    
    subgraph "服务层 (Service Layer)"
        E1[几何计算服务<br/>GeometryCalculationService]
        E2[捕捉服务<br/>SnapService]
        E3[集合服务<br/>CollectionService]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B2
    
    B1 --> C1
    B1 --> C2
    B2 --> B3
    
    C1 --> D1
    C1 --> D2
    C2 --> D3
    
    B1 --> E1
    B2 --> E2
    C1 --> E3
    
    style A1 fill:#e3f2fd
    style B1 fill:#f1f8e9
    style C1 fill:#fce4ec
    style D1 fill:#fff3e0
    style E1 fill:#f3e5f5
```

**系统架构说明：**
该架构采用分层设计，将3D距离测量功能分为五个核心层次。用户界面层包含测量工具激活按钮、实时数据显示面板和3D交互查看器。控制器层通过MeasurementController统一管理测量逻辑，与InteractionController和GeometryController协同工作。数据模型层定义了测量实体的数据结构和状态管理。渲染层负责3D场景中的线条、文本和捕捉点的可视化显示。服务层提供核心算法支持，包括几何计算、点捕捉和数据持久化功能。各层间通过信号系统进行响应式通信。

## 🔄 交互流程设计

### 用户交互状态机

```mermaid
stateDiagram-v2
    [*] --> Inactive
    
    Inactive --> ToolActivated : 点击测量工具
    ToolActivated --> FirstPointSelection : 进入测量模式
    
    FirstPointSelection --> FirstPointSelected : 点击第一个点
    FirstPointSelected --> SecondPointTracking : 显示第一点坐标
    
    SecondPointTracking --> SecondPointSelected : 点击第二个点
    SecondPointTracking --> FirstPointSelection : 右键取消
    
    SecondPointSelected --> MeasurementCompleted : 计算并显示距离
    MeasurementCompleted --> FirstPointSelection : 创建新测量
    MeasurementCompleted --> Inactive : 退出工具
    
    state FirstPointSelection {
        [*] --> WaitingForClick
        WaitingForClick --> ShowingPreview : 鼠标悬停
        ShowingPreview --> WaitingForClick : 鼠标移开
    }
    
    state SecondPointTracking {
        [*] --> ShowingDistance
        ShowingDistance --> UpdateDistance : 鼠标移动
        UpdateDistance --> ShowingDistance : 持续更新
    }
    
    note right of ToolActivated : 激活捕捉功能
    note right of FirstPointSelected : 面板显示第一点坐标
    note right of SecondPointTracking : 实时显示距离预览
    note right of MeasurementCompleted : 保存到实体列表
```

**交互状态机说明：**
这个状态机定义了3D距离测量工具的完整交互流程。从非激活状态开始，用户点击测量工具按钮进入工具激活状态，系统启用点捕捉功能。在第一点选择阶段，用户可以看到悬停预览，点击确认第一个点后面板显示其坐标。进入第二点跟踪阶段，系统实时显示动态距离值和预览线条，用户可以右键取消回到第一点选择。确认第二点后完成测量，系统计算并显示完整的距离数据，将测量结果保存到实体列表中。用户可以选择创建新的测量或退出工具。

### 数据流转过程

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as 用户界面
    participant MC as 测量控制器
    participant IC as 交互控制器
    participant SS as 捕捉服务
    participant GCS as 几何计算服务
    participant Renderer as 渲染器
    participant Panel as 测量面板
    
    User->>UI: 点击测量工具
    UI->>MC: 激活测量模式
    MC->>IC: 启用点捕捉
    IC->>SS: 初始化捕捉服务
    
    User->>UI: 鼠标悬停实体
    UI->>IC: 鼠标事件
    IC->>SS: 查找捕捉点
    SS->>Renderer: 显示捕捉预览
    
    User->>UI: 点击第一个点
    UI->>MC: 确认第一点
    MC->>Panel: 更新第一点坐标
    MC->>Renderer: 显示第一点标记
    
    User->>UI: 移动鼠标
    UI->>IC: 鼠标移动事件
    IC->>SS: 跟踪当前位置
    SS->>GCS: 计算实时距离
    GCS->>Panel: 更新距离预览
    GCS->>Renderer: 更新预览线条
    
    User->>UI: 点击第二个点
    UI->>MC: 确认第二点
    MC->>GCS: 计算最终距离
    GCS->>Panel: 显示完整数据
    MC->>Renderer: 渲染最终测量
    MC->>MC: 保存测量实体
    
    Note over User, MC: 测量完成，可创建新测量
```

**数据流转说明：**
这个时序图展示了从用户操作到数据渲染的完整数据流转过程。用户激活测量工具后，系统通过控制器启用交互模式和捕捉服务。鼠标悬停时，捕捉服务实时查找最近的可捕捉点并通过渲染器提供视觉反馈。确认第一点后，系统更新面板显示坐标并在3D场景中标记该点。鼠标移动阶段，几何计算服务持续计算当前位置与第一点的距离，实时更新面板数据和预览线条。确认第二点后，系统计算最终的完整距离数据，更新面板显示并渲染最终的测量结果，同时将测量实体保存到集合中供后续管理。

## 📊 数据模型设计

### 测量实体数据结构

```mermaid
classDiagram
    class MeasurementEntity {
        +id: string
        +type: "distance_3d"
        +name: string
        +createdAt: Date
        +isVisible: boolean
        +point1: Point3D
        +point2: Point3D
        +distances: DistanceData
        +visualStyle: MeasurementStyle
        +validate(): boolean
        +calculateDistances(): DistanceData
        +toJSON(): MeasurementEntityJSON
    }
    
    class Point3D {
        +x: number
        +y: number
        +z: number
        +entityId?: string
        +surfaceNormal?: Vector3D
        +snapType: SnapType
        +distanceTo(other: Point3D): number
        +equals(other: Point3D): boolean
    }
    
    class DistanceData {
        +deltaX: number
        +deltaY: number
        +deltaZ: number
        +distance3D: number
        +distanceXY: number
        +distanceXZ: number
        +distanceYZ: number
        +update(p1: Point3D, p2: Point3D): void
    }
    
    class MeasurementStyle {
        +lineColor: string
        +lineWidth: number
        +textColor: string
        +textSize: number
        +pointColor: string
        +pointSize: number
        +opacity: number
    }
    
    class MeasurementState {
        +currentTool: MeasurementTool
        +activePoint: Point3D | null
        +previewPoint: Point3D | null
        +measurements: Signal~MeasurementEntity[]~
        +selectedMeasurement: Signal~MeasurementEntity | null~
        +isToolActive: Signal~boolean~
    }
    
    MeasurementEntity --> Point3D : contains
    MeasurementEntity --> DistanceData : contains
    MeasurementEntity --> MeasurementStyle : contains
    MeasurementState --> MeasurementEntity : manages
    Point3D --> SnapType : uses
    MeasurementState --> MeasurementTool : uses
    
    <<enumeration>> SnapType
    SnapType : VERTEX
    SnapType : EDGE
    SnapType : FACE
    SnapType : GRID
    SnapType : FREE

    <<enumeration>> MeasurementTool
    MeasurementTool : DISTANCE_3D
    MeasurementTool : ANGLE
    MeasurementTool : AREA
```

**数据模型说明：**
核心数据模型围绕MeasurementEntity展开，它包含两个3D点、距离数据和视觉样式信息。Point3D类不仅存储坐标，还包含捕捉类型和关联实体信息，支持表面法线数据用于精确捕捉。DistanceData类计算并存储多维度的距离信息，包括3D直线距离和各坐标轴的分量距离。MeasurementStyle定义了测量结果的视觉呈现参数。MeasurementState通过Signal系统管理全局测量状态，包括当前工具模式、活动点、预览点和测量实体集合，确保UI和数据的响应式同步。

### 信号系统集成

```mermaid
graph LR
    subgraph "测量状态信号 (Measurement State Signals)"
        S1[isToolActive<br/>工具激活状态]
        S2[currentMeasurement<br/>当前测量]
        S3[previewDistance<br/>预览距离]
        S4[snapPoint<br/>捕捉点]
    end
    
    subgraph "计算信号 (Computed Signals)"
        C1[panelData<br/>面板数据]
        C2[renderObjects<br/>渲染对象]
        C3[snapCandidates<br/>捕捉候选]
        C4[measurementList<br/>测量列表]
    end
    
    subgraph "副作用 (Effects)"
        E1[Panel Update<br/>面板更新]
        E2[3D Rendering<br/>3D渲染]
        E3[Snap Preview<br/>捕捉预览]
        E4[Data Persistence<br/>数据持久化]
    end
    
    S1 --> C1
    S1 --> C3
    S2 --> C1
    S2 --> C2
    S3 --> C1
    S3 --> C2
    S4 --> C3
    
    C1 --> E1
    C2 --> E2
    C3 --> E3
    C4 --> E4
    
    style S1 fill:#e8f5e8
    style C1 fill:#e3f2fd
    style E1 fill:#fff3e0
```

**信号系统集成说明：**
测量功能深度集成到UVF的响应式信号系统中。基础状态信号包括工具激活状态、当前测量对象、预览距离和捕捉点信息。计算信号从基础信号派生，自动计算面板显示数据、3D渲染对象、捕捉候选点和测量实体列表。副作用系统监听计算信号的变化，自动触发面板UI更新、3D场景渲染、捕捉预览显示和数据持久化操作。这种响应式架构确保了数据变更的自动传播和UI的实时同步，用户操作能够立即反映到所有相关的显示组件中。

## 🎨 渲染实现设计

### 3D渲染管道

```mermaid
flowchart TD
    A[测量数据变更<br/>Measurement Data Change] --> B[信号触发<br/>Signal Trigger]
    B --> C[渲染副作用<br/>Render Effect]
    
    C --> D{测量状态<br/>Measurement State}
    
    D -->|预览模式| E[预览渲染分支<br/>Preview Rendering]
    D -->|完成模式| F[完成渲染分支<br/>Complete Rendering]
    D -->|工具非激活| G[清理渲染<br/>Cleanup Rendering]
    
    E --> E1[动态线条渲染<br/>Dynamic Line Rendering]
    E --> E2[实时文本更新<br/>Real-time Text Update]
    E --> E3[捕捉点高亮<br/>Snap Point Highlight]
    
    F --> F1[固定线条渲染<br/>Fixed Line Rendering]
    F --> F2[最终文本渲染<br/>Final Text Rendering]
    F --> F3[端点标记渲染<br/>Endpoint Marker Rendering]
    
    E1 --> H[几何缓冲区更新<br/>Geometry Buffer Update]
    E2 --> I[材质参数更新<br/>Material Parameter Update]
    E3 --> J[着色器uniform更新<br/>Shader Uniform Update]
    
    F1 --> H
    F2 --> I
    F3 --> J
    
    H --> K[Scene Graph更新<br/>Scene Graph Update]
    I --> K
    J --> K
    
    K --> L[GPU渲染指令<br/>GPU Render Commands]
    L --> M[帧缓冲输出<br/>Frame Buffer Output]
    
    G --> N[移除渲染对象<br/>Remove Render Objects]
    N --> K
    
    style A fill:#ffeb3b
    style E fill:#4caf50
    style F fill:#2196f3
    style H fill:#ff9800
    style L fill:#9c27b0
```

**3D渲染管道说明：**
测量工具的3D渲染管道基于UVF的响应式渲染系统构建。当测量数据发生变更时，信号系统触发渲染副作用，根据当前测量状态选择不同的渲染分支。预览模式下，系统渲染动态线条、实时更新距离文本和高亮捕捉点。完成模式下，渲染固定的测量线条、最终距离文本和端点标记。各个渲染组件分别更新几何缓冲区、材质参数和着色器uniform，最终汇聚到场景图更新，生成GPU渲染指令并输出到帧缓冲区。工具非激活时执行清理渲染，移除所有相关的渲染对象。

### 渲染组件架构

```mermaid
classDiagram
    class MeasurementRenderer {
        -scene: THREE.Scene
        -materials: MeasurementMaterials
        -geometries: MeasurementGeometries
        +render(measurement: MeasurementEntity): void
        +updatePreview(point1: Point3D, point2: Point3D): void
        +dispose(): void
    }
    
    class MeasurementLineRenderer {
        -lineGeometry: THREE.BufferGeometry
        -lineMaterial: THREE.LineBasicMaterial
        +updateLine(p1: Point3D, p2: Point3D): void
        +setStyle(style: MeasurementStyle): void
    }
    
    class MeasurementTextRenderer {
        -textGeometry: TextGeometry
        -textMaterial: THREE.MeshStandardMaterial
        -textMesh: THREE.Mesh
        +updateText(distance: DistanceData): void
        +updatePosition(p1: Point3D, p2: Point3D): void
    }
    
    class SnapPointRenderer {
        -pointGeometry: THREE.SphereGeometry
        -pointMaterial: THREE.MeshBasicMaterial
        -pointMesh: THREE.Mesh
        +showSnapPoint(point: Point3D): void
        +hideSnapPoint(): void
        +updateSnapType(type: SnapType): void
    }
    
    class MeasurementMaterials {
        +lineMaterial: THREE.LineBasicMaterial
        +textMaterial: THREE.MeshStandardMaterial
        +pointMaterial: THREE.MeshBasicMaterial
        +previewMaterial: THREE.LineDashedMaterial
        +updateColors(style: MeasurementStyle): void
    }
    
    class MeasurementGeometries {
        +lineGeometry: THREE.BufferGeometry
        +textGeometry: TextGeometry
        +pointGeometry: THREE.SphereGeometry
        +updateLineGeometry(p1: Point3D, p2: Point3D): void
    }
    
    MeasurementRenderer --> MeasurementLineRenderer : uses
    MeasurementRenderer --> MeasurementTextRenderer : uses
    MeasurementRenderer --> SnapPointRenderer : uses
    MeasurementRenderer --> MeasurementMaterials : uses
    MeasurementRenderer --> MeasurementGeometries : uses
    
    MeasurementLineRenderer --> MeasurementMaterials : uses
    MeasurementTextRenderer --> MeasurementMaterials : uses
    SnapPointRenderer --> MeasurementMaterials : uses
```

**渲染组件架构说明：**
渲染系统采用组件化设计，MeasurementRenderer作为主控制器协调各个专业渲染器。MeasurementLineRenderer专门处理距离线条的几何和材质更新，支持实时和静态两种模式。MeasurementTextRenderer负责3D文本的生成和定位，根据距离数据动态更新显示内容。SnapPointRenderer管理捕捉点的视觉反馈，支持不同捕捉类型的差异化显示。MeasurementMaterials和MeasurementGeometries提供共享的渲染资源管理，优化GPU资源使用。所有组件都支持样式定制和动态更新，确保渲染效果与用户配置同步。

## 🔧 核心服务实现

### 几何计算服务

```mermaid
flowchart LR
    subgraph "输入数据 (Input Data)"
        A1[Point1 坐标<br/>Point1 Coordinates]
        A2[Point2 坐标<br/>Point2 Coordinates]
        A3[坐标系信息<br/>Coordinate System]
    end
    
    subgraph "计算流程 (Calculation Process)"
        B1[向量计算<br/>Vector Calculation]
        B2[距离分量计算<br/>Distance Components]
        B3[3D距离计算<br/>3D Distance Calculation]
        B4[平面距离计算<br/>Planar Distance Calculation]
    end
    
    subgraph "输出结果 (Output Results)"
        C1[ΔX, ΔY, ΔZ<br/>Delta Components]
        C2[3D直线距离<br/>3D Linear Distance]
        C3[XY平面距离<br/>XY Plane Distance]
        C4[XZ平面距离<br/>XZ Plane Distance]
        C5[YZ平面距离<br/>YZ Plane Distance]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    
    B1 --> B2
    B1 --> B3
    B1 --> B4
    
    B2 --> C1
    B3 --> C2
    B4 --> C3
    B4 --> C4
    B4 --> C5
    
    style B1 fill:#e8f5e8
    style B3 fill:#e3f2fd
    style C2 fill:#fff3e0
```

**几何计算服务说明：**
几何计算服务是测量功能的数学核心，负责所有距离相关的计算。服务接收两个3D点坐标和坐标系信息作为输入，通过向量计算得到两点间的方向向量。基于此向量，系统计算各坐标轴的距离分量（ΔX、ΔY、ΔZ），然后计算3D空间中的直线距离。同时，服务还计算各个坐标平面内的投影距离（XY、XZ、YZ平面距离），为用户提供全面的空间距离分析数据。所有计算都考虑坐标系变换，确保在不同视图和模型坐标系下的准确性。

### 点捕捉服务架构

```mermaid
graph TB
    subgraph "捕捉策略 (Snap Strategies)"
        S1[顶点捕捉<br/>Vertex Snap]
        S2[边缘捕捉<br/>Edge Snap]
        S3[面捕捉<br/>Face Snap]	
        S4[网格捕捉<br/>Grid Snap]
        S5[自由点捕捉<br/>Free Point Snap]
    end
    
    subgraph "捕捉服务核心 (Snap Service Core)"
        C1[射线投射<br/>Ray Casting]
        C2[碰撞检测<br/>Collision Detection]
        C3[距离计算<br/>Distance Calculation]
        C4[优先级排序<br/>Priority Sorting]
    end
    
    subgraph "输入输出 (Input/Output)"
        I1[鼠标位置<br/>Mouse Position]
        I2[相机参数<br/>Camera Parameters]
        O1[捕捉点<br/>Snap Point]
        O2[捕捉类型<br/>Snap Type]
        O3[关联实体<br/>Associated Entity]
    end
    
    I1 --> C1
    I2 --> C1
    
    C1 --> C2
    C2 --> S1
    C2 --> S2
    C2 --> S3
    C2 --> S4
    C2 --> S5
    
    S1 --> C3
    S2 --> C3
    S3 --> C3
    S4 --> C3
    S5 --> C3
    
    C3 --> C4
    C4 --> O1
    C4 --> O2
    C4 --> O3
    
    style C1 fill:#e8f5e8
    style C4 fill:#e3f2fd
    style O1 fill:#fff3e0
```

**点捕捉服务说明：**
点捕捉服务提供精确的3D点选择功能，支持五种不同的捕捉策略。服务核心基于射线投射技术，将鼠标位置和相机参数转换为3D射线，然后进行碰撞检测找到所有可能的捕捉目标。不同的捕捉策略处理不同类型的几何元素：顶点捕捉直接定位到几何体顶点，边缘捕捉找到边线上的最近点，面捕捉计算表面交点，网格捕捉对齐到虚拟网格，自由点捕捉允许任意位置选择。距离计算模块评估所有候选点与鼠标位置的距离，优先级排序确保最合适的捕捉点被选中。

## 🖥️ 用户界面设计

### 测量面板组件

```mermaid
flowchart TD
    A[测量面板<br/>Measurement Panel] --> B[面板头部<br/>Panel Header]
    A --> C[坐标显示区<br/>Coordinates Section]
    A --> D[距离显示区<br/>Distance Section]
    A --> E[控制按钮区<br/>Control Buttons]
    
    B --> B1[工具标题<br/>3D Distance Measurement]
    B --> B2[状态指示器<br/>Status Indicator]
    B --> B3[关闭按钮<br/>Close Button]
    
    C --> C1[第一点坐标<br/>Point 1: X, Y, Z]
    C --> C2[第二点坐标<br/>Point 2: X, Y, Z]
    C --> C3[坐标单位<br/>Unit Display]
    
    D --> D1[X轴距离<br/>ΔX Distance]
    D --> D2[Y轴距离<br/>ΔY Distance]
    D --> D3[Z轴距离<br/>ΔZ Distance]
    D --> D4[3D直线距离<br/>3D Linear Distance]
    D --> D5[平面距离<br/>Planar Distances]
    
    E --> E1[重置按钮<br/>Reset Button]
    E --> E2[复制按钮<br/>Copy Button]
    E --> E3[保存按钮<br/>Save Button]
    E --> E4[新建测量<br/>New Measurement]
    
    style A fill:#e3f2fd
    style C fill:#f1f8e9
    style D fill:#fff3e0
    style E fill:#fce4ec
```

**测量面板组件说明：**
测量面板采用分区设计，提供清晰的信息层次结构。面板头部包含工具标题、当前状态指示器（显示"选择第一点"、"选择第二点"、"测量完成"等状态）和关闭按钮。坐标显示区实时显示两个测量点的精确3D坐标，包含单位信息和数值精度控制。距离显示区展示完整的距离分析数据，包括各坐标轴分量和3D直线距离，以及XY、XZ、YZ三个平面的投影距离。控制按钮区提供测量操作功能：重置清空当前测量、复制将数据复制到剪贴板、保存将测量添加到实体列表、新建开始下一个测量。所有数值显示都是只读的，确保数据完整性。

### 实体管理界面

```mermaid
graph LR
    subgraph "实体列表 (Entity List)"
        A1[测量实体项<br/>Measurement Item 1]
        A2[测量实体项<br/>Measurement Item 2]
        A3[测量实体项<br/>Measurement Item 3]
    end
    
    subgraph "实体项详情 (Item Details)"
        B1[实体名称<br/>Entity Name]
        B2[测量数据<br/>Measurement Data]
        B3[创建时间<br/>Created Time]
        B4[可见性状态<br/>Visibility Status]
    end
    
    subgraph "操作按钮 (Action Buttons)"
        C1[显示/隐藏<br/>Show/Hide Toggle]
        C2[重命名<br/>Rename]
        C3[复制数据<br/>Copy Data]
        C4[删除<br/>Delete]
        C5[定位<br/>Focus View]
    end
    
    subgraph "批量操作 (Batch Operations)"
        D1[全选/取消<br/>Select All/None]
        D2[批量显示<br/>Batch Show]
        D3[批量隐藏<br/>Batch Hide]
        D4[批量删除<br/>Batch Delete]
        D5[导出数据<br/>Export Data]
    end
    
    A1 --> B1
    A1 --> B2
    A1 --> B3
    A1 --> B4
    
    B1 --> C1
    B2 --> C2
    B3 --> C3
    B4 --> C4
    B1 --> C5
    
    A1 --> D1
    A2 --> D1
    A3 --> D1
    
    D1 --> D2
    D1 --> D3
    D1 --> D4
    D1 --> D5
    
    style A1 fill:#e8f5e8
    style B2 fill:#e3f2fd
    style C1 fill:#fff3e0
    style D5 fill:#fce4ec
```

**实体管理界面说明：**
实体管理界面为用户提供完整的测量结果管理功能。每个测量实体项显示实体名称、关键测量数据（如3D距离）、创建时间和当前可见性状态。单个实体的操作包括显示/隐藏切换、重命名、数据复制、删除和视图定位功能。批量操作支持多选模式，用户可以同时管理多个测量实体：全选或取消选择、批量显示或隐藏、批量删除和数据导出功能。界面设计注重用户体验，提供清晰的视觉反馈和直观的操作流程，支持View模式和Draft模式下的一致性操作体验。

## 🔄 状态管理集成

### 响应式状态流

```mermaid
flowchart LR
    subgraph "用户操作 (User Actions)"
        U1[激活工具<br/>Activate Tool]
        U2[点击第一点<br/>Click Point 1]
        U3[移动鼠标<br/>Mouse Move]
        U4[点击第二点<br/>Click Point 2]
        U5[重置测量<br/>Reset]
    end
    
    subgraph "状态信号 (State Signals)"
        S1[toolActive<br/>Signal of boolean]
        S2[point1<br/>Signal of Point3D or null]
        S3[previewPoint<br/>Signal of Point3D or null]
        S4[point2<br/>Signal of Point3D or null]
        S5[measurementComplete<br/>Signal of boolean]
    end
    
    subgraph "计算信号 (Computed Signals)"
        C1[panelData<br/>Computed of PanelData]
        C2[previewDistance<br/>Computed of number]
        C3[renderObjects<br/>Computed of RenderObject array]
        C4[canComplete<br/>Computed of boolean]
    end
    
    subgraph "副作用 (Effects)"
        E1[更新面板<br/>Update Panel]
        E2[渲染3D<br/>Render 3D]
        E3[保存数据<br/>Save Data]
        E4[清理状态<br/>Cleanup State]
    end
    
    U1 --> S1
    U2 --> S2
    U3 --> S3
    U4 --> S4
    U5 --> S1
    U5 --> S2
    U5 --> S4
    
    S1 --> C1
    S1 --> C3
    S2 --> C1
    S2 --> C2
    S2 --> C3
    S3 --> C2
    S3 --> C3
    S4 --> C1
    S4 --> C4
    S5 --> C4
    
    C1 --> E1
    C2 --> E1
    C3 --> E2
    C4 --> E3
    S1 --> E4
    
    style U1 fill:#ffeb3b
    style S1 fill:#4caf50
    style C1 fill:#2196f3
    style E1 fill:#ff9800
```

**响应式状态流说明：**
测量工具完全基于UVF的响应式状态管理系统构建。用户操作直接触发相应的状态信号更新：激活工具更新toolActive信号，点击操作更新点位信号，鼠标移动更新预览点信号。计算信号自动从基础状态信号派生：panelData根据当前点位计算面板显示数据，previewDistance实时计算预览距离，renderObjects生成3D渲染所需的对象列表，canComplete判断是否可以完成测量。副作用系统监听计算信号变化，自动执行相应操作：更新面板UI、渲染3D场景、保存测量数据和清理无效状态。这种响应式架构确保了状态变更的自动传播和UI的实时同步。

## 📦 实施计划

### 开发阶段规划

```mermaid
gantt
    title 3D距离测量工具开发计划
    dateFormat  YYYY-MM-DD
    section 第一阶段：基础架构
    数据模型设计           :done, phase1-1, 2025-10-15, 3d
    信号系统集成           :done, phase1-2, after phase1-1, 2d
    基础控制器实现         :active, phase1-3, after phase1-2, 4d
    几何计算服务           : phase1-4, after phase1-3, 3d
    
    section 第二阶段：交互功能
    点捕捉服务实现         : phase2-1, after phase1-4, 5d
    交互状态机             : phase2-2, after phase2-1, 3d
    用户界面组件           : phase2-3, after phase2-2, 4d
    测量面板实现           : phase2-4, after phase2-3, 3d
    
    section 第三阶段：渲染系统
    3D渲染器开发           : phase3-1, after phase2-4, 6d
    线条和文本渲染         : phase3-2, after phase3-1, 4d
    捕捉点可视化           : phase3-3, after phase3-2, 2d
    样式系统实现           : phase3-4, after phase3-3, 3d
    
    section 第四阶段：实体管理
    实体存储系统           : phase4-1, after phase3-4, 3d
    实体列表界面           : phase4-2, after phase4-1, 4d
    批量操作功能           : phase4-3, after phase4-2, 3d
    数据导入导出           : phase4-4, after phase4-3, 2d
    
    section 第五阶段：测试与优化
    单元测试编写           : phase5-1, after phase4-4, 5d
    集成测试实施           : phase5-2, after phase5-1, 3d
    性能优化调整           : phase5-3, after phase5-2, 4d
    用户体验优化           : phase5-4, after phase5-3, 3d
```

### 技术风险评估

```mermaid
quadrantChart
    title Risk Assessment Matrix
    x-axis Low Impact --> High Impact
    y-axis Low Probability --> High Probability
    
    quadrant-1 Monitor
    quadrant-2 High Risk
    quadrant-3 Low Risk
    quadrant-4 Medium Risk
    
    "3D Rendering": [0.8, 0.3]
    "Point Snapping": [0.7, 0.6]
    "Memory Leaks": [0.4, 0.7]
    "Coordinate Transform": [0.6, 0.4]
    "Concurrent State": [0.5, 0.5]
    "UI Responsiveness": [0.3, 0.6]
    "Data Consistency": [0.7, 0.2]
    "Browser Compatibility": [0.2, 0.3]
```

**实施计划说明：**
开发计划分为五个递进阶段，总计约35个工作日。第一阶段建立基础架构，包括数据模型、信号系统集成和核心控制器。第二阶段实现用户交互功能，重点是点捕捉服务和交互状态机。第三阶段开发3D渲染系统，实现测量结果的可视化展示。第四阶段构建实体管理功能，支持测量结果的持久化和批量操作。第五阶段进行全面测试和优化，确保功能稳定性和用户体验。

**技术风险评估**识别了关键风险点：点捕捉精度和内存泄漏为高概率风险，需要重点关注；3D渲染性能和数据一致性为高影响风险，需要充分测试；并发状态管理为中等风险，需要制定应对策略。

## 🎯 总结

本设计文档为UVF框架中的3D距离测量工具提供了完整的技术实施方案。设计充分利用了框架的响应式架构、模块化设计和Three.js渲染能力，确保功能的高质量实现和良好的用户体验。

### 核心优势

- **响应式架构集成**：深度集成信号系统，确保状态同步和UI响应性
- **模块化设计**：清晰的职责分离，便于维护和扩展
- **专业3D渲染**：基于Three.js的高质量可视化展示
- **完善的交互体验**：直观的点捕捉和实时预览功能
- **数据管理完整**：支持测量结果的完整生命周期管理

### 技术特色

- **精确的几何计算**：多维度距离分析和坐标系支持
- **智能点捕捉**：多策略捕捉系统，提供精确的点选择
- **实时渲染反馈**：动态预览和即时视觉反馈
- **状态管理一致性**：基于Signal系统的可靠状态同步
- **扩展性设计**：为未来功能扩展预留充足接口

这个设计方案为开发团队提供了清晰的实施路径，确保3D距离测量工具能够无缝集成到UVF框架中，为用户提供专业级的空间分析能力。