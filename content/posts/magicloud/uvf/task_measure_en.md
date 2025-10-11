# Unified Visualization Framework - 3D Distance Measurement Tool Design

## 📏 Requirement Overview

This document details the technical design for implementing a 3D distance measurement tool within the UVF framework. This tool allows users to measure the spatial distance between two points by clicking in the 3D viewer, providing a complete measurement data panel and visual representation.

## 🏗️ Overall Architecture Design

### System Architecture Overview

```mermaid
graph TB
    subgraph "UI Layer"
        A1[Measure Tool Button]
        A2[Measurement Panel]
        A3[3D Viewer]
    end
    
    subgraph "Controller Layer"
        B1[MeasurementController]
        B2[InteractionController]
        B3[GeometryController]
    end
    
    subgraph "Model Layer"
        C1[MeasurementEntity]
        C2[MeasurementState]
        C3[Point3D Data]
    end
    
    subgraph "Rendering Layer"
        D1[MeasurementLineRenderer]
        D2[MeasurementTextRenderer]
        D3[PointSnapRenderer]
    end
    
    subgraph "Service Layer"
        E1[GeometryCalculationService]
        E2[SnapService]
        E3[CollectionService]
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

**System Architecture Description:**
This architecture uses a layered design, dividing the 3D distance measurement functionality into five core layers. The UI Layer contains the measurement tool activation button, a real-time data display panel, and the 3D interactive viewer. The Controller Layer uses the `MeasurementController` to manage the overall measurement logic, coordinating with the `InteractionController` and `GeometryController`. The Model Layer defines the data structure and state management for measurement entities. The Rendering Layer is responsible for the visual display of lines, text, and snap points in the 3D scene. The Service Layer provides core algorithm support, including geometry calculation, point snapping, and data persistence functions. Communication between layers is handled reactively through a signal system.

## 🔄 Interaction Flow Design

### User Interaction State Machine

```mermaid
stateDiagram-v2
    [*] --> Inactive
    
    Inactive --> ToolActivated : Click measure tool
    ToolActivated --> FirstPointSelection : Enter measurement mode
    
    FirstPointSelection --> FirstPointSelected : Click first point
    FirstPointSelected --> SecondPointTracking : Display first point coordinates
    
    SecondPointTracking --> SecondPointSelected : Click second point
    SecondPointTracking --> FirstPointSelection : Right-click to cancel
    
    SecondPointSelected --> MeasurementCompleted : Calculate and display distance
    MeasurementCompleted --> FirstPointSelection : Create new measurement
    MeasurementCompleted --> Inactive : Exit tool
    
    state FirstPointSelection {
        [*] --> WaitingForClick
        WaitingForClick --> ShowingPreview : Mouse hover
        ShowingPreview --> WaitingForClick : Mouse leave
    }
    
    state SecondPointTracking {
        [*] --> ShowingDistance
        ShowingDistance --> UpdateDistance : Mouse move
        UpdateDistance --> ShowingDistance : Continuous update
    }
    
    note right of ToolActivated : Activate snap feature
    note right of FirstPointSelected : Panel shows first point coordinates
    note right of SecondPointTracking : Real-time distance preview
    note right of MeasurementCompleted : Save to entity list
```

**Interaction State Machine Description:**
This state machine defines the complete interaction flow for the 3D distance measurement tool. Starting from an inactive state, the user clicks the measure tool button to enter the `ToolActivated` state, where the system enables the point snapping feature. In the `FirstPointSelection` stage, the user sees a hover preview. After clicking to confirm the first point, the panel displays its coordinates. The flow then enters the `SecondPointTracking` stage, where the system shows a dynamic distance value and a preview line; the user can right-click to cancel and return to `FirstPointSelection`. After confirming the second point, the measurement is completed. The system calculates and displays the full distance data and saves the measurement result to the entity list. The user can then choose to create a new measurement or exit the tool.

### Data Flow Process

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant MC as MeasurementController
    participant IC as InteractionController
    participant SS as SnapService
    participant GCS as GeometryCalculationService
    participant Renderer
    participant Panel as MeasurementPanel
    
    User->>UI: Click measure tool
    UI->>MC: Activate measurement mode
    MC->>IC: Enable point snapping
    IC->>SS: Initialize snap service
    
    User->>UI: Hover over entity
    UI->>IC: Mouse event
    IC->>SS: Find snap point
    SS->>Renderer: Show snap preview
    
    User->>UI: Click first point
    UI->>MC: Confirm first point
    MC->>Panel: Update first point coordinates
    MC->>Renderer: Show first point marker
    
    User->>UI: Move mouse
    UI->>IC: Mouse move event
    IC->>SS: Track current position
    SS->>GCS: Calculate real-time distance
    GCS->>Panel: Update distance preview
    GCS->>Renderer: Update preview line
    
    User->>UI: Click second point
    UI->>MC: Confirm second point
    MC->>GCS: Calculate final distance
    GCS->>Panel: Display full data
    MC->>Renderer: Render final measurement
    MC->>MC: Save measurement entity
    
    Note over User, MC: Measurement complete, can create new measurement
```

**Data Flow Description:**
This sequence diagram illustrates the complete data flow from user action to data rendering. When the user activates the measurement tool, the system enables interaction mode and the snap service via the controllers. On mouse hover, the snap service finds the nearest snappable point and provides visual feedback through the renderer. After the first point is confirmed, the system updates the panel with its coordinates and marks the point in the 3D scene. During mouse movement, the geometry calculation service continuously computes the distance from the current position to the first point, updating the panel data and preview line in real-time. Once the second point is confirmed, the system calculates the final, complete distance data, updates the panel display, renders the final measurement, and saves the measurement entity to a collection for later management.

## 📊 Data Model Design

### Measurement Entity Data Structure

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

**Data Model Description:**
The core data model is centered around the `MeasurementEntity`, which contains two 3D points, distance data, and visual style information. The `Point3D` class stores not only coordinates but also the snap type and associated entity information, supporting surface normal data for precise snapping. The `DistanceData` class calculates and stores multi-dimensional distance information, including the 3D linear distance and component distances along each axis. `MeasurementStyle` defines the visual presentation parameters for the measurement result. `MeasurementState` manages the global measurement state via the Signal system, including the current tool mode, active point, preview point, and the collection of measurement entities, ensuring reactive synchronization between UI and data.

### Signal System Integration

```mermaid
graph LR
    subgraph "Measurement State Signals"
        S1[isToolActive<br/>Tool Active State]
        S2[currentMeasurement<br/>Current Measurement]
        S3[previewDistance<br/>Preview Distance]
        S4[snapPoint<br/>Snap Point]
    end
    
    subgraph "Computed Signals"
        C1[panelData<br/>Panel Data]
        C2[renderObjects<br/>Render Objects]
        C3[snapCandidates<br/>Snap Candidates]
        C4[measurementList<br/>Measurement List]
    end
    
    subgraph "Effects"
        E1[Panel Update]
        E2[3D Rendering]
        E3[Snap Preview]
        E4[Data Persistence]
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

**Signal System Integration Description:**
The measurement functionality is deeply integrated into UVF's reactive signal system. Base state signals include the tool's active state, the current measurement object, the preview distance, and snap point information. Computed signals are derived from these base signals, automatically calculating panel display data, 3D render objects, snap candidates, and the list of measurement entities. The effect system listens for changes in computed signals and automatically triggers panel UI updates, 3D scene rendering, snap preview display, and data persistence operations. This reactive architecture ensures automatic propagation of data changes and real-time synchronization of the UI, so user actions are immediately reflected in all relevant display components.

## 🎨 Rendering Implementation Design

### 3D Rendering Pipeline

```mermaid
flowchart TD
    A[Measurement Data Change] --> B[Signal Trigger]
    B --> C[Render Effect]
    
    C --> D{Measurement State}
    
    D -->|Preview Mode| E[Preview Rendering Branch]
    D -->|Complete Mode| F[Complete Rendering Branch]
    D -->|Tool Inactive| G[Cleanup Rendering]
    
    E --> E1[Dynamic Line Rendering]
    E --> E2[Real-time Text Update]
    E --> E3[Snap Point Highlight]
    
    F --> F1[Fixed Line Rendering]
    F --> F2[Final Text Rendering]
    F --> F3[Endpoint Marker Rendering]
    
    E1 --> H[Geometry Buffer Update]
    E2 --> I[Material Parameter Update]
    E3 --> J[Shader Uniform Update]
    
    F1 --> H
    F2 --> I
    F3 --> J
    
    H --> K[Scene Graph Update]
    I --> K
    J --> K
    
    K --> L[GPU Render Commands]
    L --> M[Frame Buffer Output]
    
    G --> N[Remove Render Objects]
    N --> K
    
    style A fill:#ffeb3b
    style E fill:#4caf50
    style F fill:#2196f3
    style H fill:#ff9800
    style L fill:#9c27b0
```

**3D Rendering Pipeline Description:**
The measurement tool's 3D rendering pipeline is built on UVF's reactive rendering system. When measurement data changes, the signal system triggers a render effect, which selects a different rendering branch based on the current measurement state. In preview mode, the system renders a dynamic line, updates the distance text in real-time, and highlights the snap point. In complete mode, it renders a fixed measurement line, the final distance text, and endpoint markers. Each rendering component updates its respective geometry buffers, material parameters, and shader uniforms, which are then consolidated in a scene graph update to generate GPU render commands and output to the frame buffer. When the tool is deactivated, a cleanup render is performed to remove all related render objects.

### Rendering Component Architecture

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

**Rendering Component Architecture Description:**
The rendering system uses a component-based design, with `MeasurementRenderer` acting as the main controller that coordinates various specialized renderers. `MeasurementLineRenderer` handles geometry and material updates for the distance line, supporting both real-time and static modes. `MeasurementTextRenderer` is responsible for generating and positioning 3D text, dynamically updating its content based on distance data. `SnapPointRenderer` manages the visual feedback for snap points, supporting different displays for various snap types. `MeasurementMaterials` and `MeasurementGeometries` provide shared management of rendering resources to optimize GPU usage. All components support style customization and dynamic updates to ensure the rendering effect is synchronized with user configurations.

## 🔧 Core Service Implementation

### Geometry Calculation Service

```mermaid
flowchart LR
    subgraph "Input Data"
        A1[Point1 Coordinates]
        A2[Point2 Coordinates]
        A3[Coordinate System]
    end
    
    subgraph "Calculation Process"
        B1[Vector Calculation]
        B2[Distance Components]
        B3[3D Distance Calculation]
        B4[Planar Distance Calculation]
    end
    
    subgraph "Output Results"
        C1[ΔX, ΔY, ΔZ<br/>Delta Components]
        C2[3D Linear Distance]
        C3[XY Plane Distance]
        C4[XZ Plane Distance]
        C5[YZ Plane Distance]
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

**Geometry Calculation Service Description:**
The geometry calculation service is the mathematical core of the measurement feature, responsible for all distance-related computations. The service takes two 3D point coordinates and coordinate system information as input, calculating the direction vector between the two points. Based on this vector, the system computes the distance components for each axis (ΔX, ΔY, ΔZ) and then calculates the linear distance in 3D space. Additionally, the service calculates the projected distances within each coordinate plane (XY, XZ, and YZ planes) to provide the user with comprehensive spatial distance analysis data. All calculations account for coordinate system transformations to ensure accuracy across different views and model coordinate systems.

### Point Snap Service Architecture

```mermaid
graph TB
    subgraph "Snap Strategies"
        S1[Vertex Snap]
        S2[Edge Snap]
        S3[Face Snap]	
        S4[Grid Snap]
        S5[Free Point Snap]
    end
    
    subgraph "Snap Service Core"
        C1[Ray Casting]
        C2[Collision Detection]
        C3[Distance Calculation]
        C4[Priority Sorting]
    end
    
    subgraph "Input/Output"
        I1[Mouse Position]
        I2[Camera Parameters]
        O1[Snap Point]
        O2[Snap Type]
        O3[Associated Entity]
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

**Point Snap Service Description:**
The point snap service provides precise 3D point selection functionality, supporting five different snapping strategies. The service core is based on ray casting technology, converting the mouse position and camera parameters into a 3D ray, and then performing collision detection to find all possible snap targets. Different snap strategies handle different types of geometric elements: vertex snapping directly targets geometry vertices, edge snapping finds the nearest point on an edge, face snapping calculates the intersection point on a surface, grid snapping aligns to a virtual grid, and free point snapping allows selection at any position. The distance calculation module evaluates the distance of all candidate points from the mouse position, and priority sorting ensures that the most appropriate snap point is selected.

## 🖥️ User Interface Design

### Measurement Panel Component

```mermaid
flowchart TD
    A[Measurement Panel] --> B[Panel Header]
    A --> C[Coordinates Section]
    A --> D[Distance Section]
    A --> E[Control Buttons]
    
    B --> B1[Tool Title<br/>3D Distance Measurement]
    B --> B2[Status Indicator]
    B --> B3[Close Button]
    
    C --> C1[Point 1: X, Y, Z]
    C --> C2[Point 2: X, Y, Z]
    C --> C3[Unit Display]
    
    D --> D1[ΔX Distance]
    D --> D2[ΔY Distance]
    D --> D3[ΔZ Distance]
    D --> D4[3D Linear Distance]
    D --> D5[Planar Distances]
    
    E --> E1[Reset Button]
    E --> E2[Copy Button]
    E --> E3[Save Button]
    E --> E4[New Measurement]
    
    style A fill:#e3f2fd
    style C fill:#f1f8e9
    style D fill:#fff3e0
    style E fill:#fce4ec
```

**Measurement Panel Component Description:**
The measurement panel uses a sectioned design to provide a clear information hierarchy. The panel header contains the tool title, a current status indicator (displaying states like "Select first point", "Select second point", "Measurement complete"), and a close button. The coordinates section displays the precise 3D coordinates of the two measurement points in real-time, including unit information and numerical precision control. The distance section shows a complete analysis of distance data, including components for each axis, the 3D linear distance, and projected distances on the XY, XZ, and YZ planes. The control buttons section provides measurement operations: Reset clears the current measurement, Copy copies the data to the clipboard, Save adds the measurement to the entity list, and New starts the next measurement. All numerical displays are read-only to ensure data integrity.

### Entity Management Interface

```mermaid
graph LR
    subgraph "Entity List"
        A1[Measurement Item 1]
        A2[Measurement Item 2]
        A3[Measurement Item 3]
    end
    
    subgraph "Item Details"
        B1[Entity Name]
        B2[Measurement Data]
        B3[Created Time]
        B4[Visibility Status]
    end
    
    subgraph "Action Buttons"
        C1[Show/Hide Toggle]
        C2[Rename]
        C3[Copy Data]
        C4[Delete]
        C5[Focus View]
    end
    
    subgraph "Batch Operations"
        D1[Select All/None]
        D2[Batch Show]
        D3[Batch Hide]
        D4[Batch Delete]
        D5[Export Data]
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

**Entity Management Interface Description:**
The entity management interface provides users with complete control over their measurement results. Each measurement entity item displays the entity name, key measurement data (like 3D distance), creation time, and current visibility status. Operations for a single entity include a show/hide toggle, rename, copy data, delete, and focus view. Batch operations support a multi-select mode, allowing users to manage multiple measurement entities simultaneously: select all or none, batch show or hide, batch delete, and export data. The interface design focuses on user experience, providing clear visual feedback and an intuitive workflow, supporting a consistent experience in both View and Draft modes.

## 🔄 State Management Integration

### Reactive State Flow

```mermaid
flowchart LR
    subgraph "User Actions"
        U1[Activate Tool]
        U2[Click Point 1]
        U3[Mouse Move]
        U4[Click Point 2]
        U5[Reset]
    end
    
    subgraph "State Signals"
        S1[toolActive<br/>Signal of boolean]
        S2[point1<br/>Signal of Point3D or null]
        S3[previewPoint<br/>Signal of Point3D or null]
        S4[point2<br/>Signal of Point3D or null]
        S5[measurementComplete<br/>Signal of boolean]
    end
    
    subgraph "Computed Signals"
        C1[panelData<br/>Computed of PanelData]
        C2[previewDistance<br/>Computed of number]
        C3[renderObjects<br/>Computed of RenderObject array]
        C4[canComplete<br/>Computed of boolean]
    end
    
    subgraph "Effects"
        E1[Update Panel]
        E2[Render 3D]
        E3[Save Data]
        E4[Cleanup State]
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

**Reactive State Flow Description:**
The measurement tool is built entirely on UVF's reactive state management system. User actions directly trigger corresponding state signal updates: activating the tool updates the `toolActive` signal, click actions update point signals, and mouse movement updates the preview point signal. Computed signals are automatically derived from the base state signals: `panelData` calculates the panel display data based on the current points, `previewDistance` calculates the preview distance in real-time, `renderObjects` generates the list of objects needed for 3D rendering, and `canComplete` determines if a measurement can be finalized. The effect system listens for changes in computed signals and automatically executes corresponding actions: updating the panel UI, rendering the 3D scene, saving measurement data, and cleaning up invalid states. This reactive architecture ensures automatic propagation of state changes and real-time UI synchronization.

## 📦 Implementation Plan

### Development Phase Planning

```mermaid
gantt
    title 3D Distance Measurement Tool Development Plan
    dateFormat  YYYY-MM-DD
    section Phase 1: Basic Architecture
    Data Model Design           :done, phase1-1, 2025-10-15, 3d
    Signal System Integration   :done, phase1-2, after phase1-1, 2d
    Base Controller Implementation :active, phase1-3, after phase1-2, 4d
    Geometry Calculation Service   : phase1-4, after phase1-3, 3d
    
    section Phase 2: Interactive Features
    Point Snap Service Implementation : phase2-1, after phase1-4, 5d
    Interaction State Machine         : phase2-2, after phase2-1, 3d
    User Interface Components         : phase2-3, after phase2-2, 4d
    Measurement Panel Implementation  : phase2-4, after phase2-3, 3d
    
    section Phase 3: Rendering System
    3D Renderer Development       : phase3-1, after phase2-4, 6d
    Line and Text Rendering       : phase3-2, after phase3-1, 4d
    Snap Point Visualization      : phase3-3, after phase3-2, 2d
    Style System Implementation   : phase3-4, after phase3-3, 3d
    
    section Phase 4: Entity Management
    Entity Storage System       : phase4-1, after phase3-4, 3d
    Entity List Interface       : phase4-2, after phase4-1, 4d
    Batch Operations Feature    : phase4-3, after phase4-2, 3d
    Data Import/Export          : phase4-4, after phase4-3, 2d
    
    section Phase 5: Testing and Optimization
    Unit Test Writing           : phase5-1, after phase4-4, 5d
    Integration Testing         : phase5-2, after phase5-1, 3d
    Performance Tuning          : phase5-3, after phase5-2, 4d
    User Experience Optimization: phase5-4, after phase5-3, 3d
```

### Technical Risk Assessment

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

**Implementation Plan Description:**
The development plan is divided into five progressive phases, totaling approximately 35 working days. Phase 1 establishes the basic architecture, including the data model, signal system integration, and core controllers. Phase 2 implements user interaction features, focusing on the point snap service and interaction state machine. Phase 3 develops the 3D rendering system to visualize measurement results. Phase 4 builds entity management functionality, supporting persistence and batch operations for measurement results. Phase 5 involves comprehensive testing and optimization to ensure functional stability and a good user experience.

**Technical Risk Assessment** identifies key risk points: point snapping accuracy and memory leaks are high-probability risks requiring special attention; 3D rendering performance and data consistency are high-impact risks that need thorough testing; concurrent state management is a medium risk that requires a mitigation strategy.

## 🎯 Summary

This design document provides a complete technical implementation plan for the 3D distance measurement tool in the UVF framework. The design fully leverages the framework's reactive architecture, modular design, and Three.js rendering capabilities to ensure a high-quality implementation and a great user experience.

### Core Advantages

- **Reactive Architecture Integration**: Deep integration with the signal system ensures state synchronization and UI responsiveness.
- **Modular Design**: Clear separation of responsibilities facilitates maintenance and extension.
- **Professional 3D Rendering**: High-quality visual representation based on Three.js.
- **Refined Interaction Experience**: Intuitive point snapping and real-time preview functionality.
- **Complete Data Management**: Supports the full lifecycle management of measurement results.

### Technical Features

- **Precise Geometric Calculations**: Multi-dimensional distance analysis and coordinate system support.
- **Intelligent Point Snapping**: Multi-strategy snapping system for precise point selection.
- **Real-time Rendering Feedback**: Dynamic previews and immediate visual feedback.
- **Consistent State Management**: Reliable state synchronization based on the Signal system.
- **Extensible Design**: Ample interfaces reserved for future feature extensions.

This design plan provides a clear implementation path for the development team, ensuring that the 3D distance measurement tool can be seamlessly integrated into the UVF framework to provide users with professional-grade spatial analysis capabilities.