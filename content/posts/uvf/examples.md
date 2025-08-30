# UVF (Unified Visualization Framework) 框架解读

基于对UVF项目中所有Stories和Examples的深度分析，本文从架构层面和应用层面全面解读该3D可视化框架，帮助开发者快速上手。

## 框架总览

UVF是一个基于Three.js的统一可视化框架，专门用于工程和科学数据的3D可视化。该框架采用模块化设计，通过Manifest驱动的方式来描述和渲染复杂的3D场景。

## 核心架构

### 1. 分层架构设计

```
应用层 (Application Layer)
├── React/HTML组件
├── Storybook Examples
└── Demo应用

核心层 (Core Layer)
├── ThreeViewer (主视图器)
├── GeometryController (几何控制器)
├── FieldController (场域控制器)
├── EnvironmentController (环境控制器)
└── GroupManager (组管理器)

数据层 (Data Layer)
├── Manifest System (清单系统)
├── Loaders (加载器)
├── MessageService (消息服务)
└── Progress Tracking (进度跟踪)

渲染层 (Rendering Layer)
├── Three.js Adapters
├── Shaders
├── Generic Models
└── Renderers
```

### 2. 核心组件详解

#### ThreeViewer - 主视图器
- **职责**: 3D场景的主要入口点和控制中心
- **功能**: 
  - 场景管理和渲染
  - 交互控制（选择、悬停、缩放）
  - 视图控制和相机管理
  - 背景和环境设置

#### GeometryController - 几何控制器  
- **职责**: 几何对象的创建和管理
- **支持的几何类型**:
  - 基础几何体（点、线、面、体）
  - 复杂模型（飞机、轮船等工程模型）
  - 注释对象（文本、标注、测量）
  - 草图对象（axes、planes）

#### FieldController - 场域控制器
- **职责**: 科学计算数据的可视化
- **核心功能**:
  - 场数据映射和渲染
  - 等值线/等值面生成
  - 颜色映射和标量场可视化
  - 流线可视化
  - 对数标度支持

#### EnvironmentController - 环境控制器
- **职责**: 场景环境设置
- **功能**:
  - 背景设置（纯色、渐变、天空盒）
  - 光照控制
  - 色调映射
  - 后处理效果

### 3. 数据驱动架构

#### Manifest系统
UVF采用Manifest（清单）系统来描述3D场景：

```typescript
interface ManifestBundle {
  id: ManifestObjectId;
  type: string;
  properties: Record<string, any>;
  attributions?: {
    members?: ManifestObjectId[];  // 组成员列表
    packedParentId?: string;       // 打包几何体父ID
    edges?: ManifestObjectId[];    // 关联边线
    faces?: ManifestObjectId[];    // 关联面
  };
  resources?: Record<string, any>;
  tags?: string[];
  // 其他属性...
}
```

#### ManifestBundle中的三大核心字段处理机制

##### 1. **type** - 对象类型路由
UVF通过`type`字段实现对象的类型识别和工厂路由：

```typescript
// 支持的主要类型
const supportedTypes = [
  'GeometryGroup',     // 几何组
  'SolidGeometry',     // 实体几何
  'Face',              // 面
  'Edge',              // 边
  'Point',             // 点
  'Axis',              // 坐标轴
  'Plane',             // 平面
  'Sphere',            // 球体
  // ... 其他类型
];

// 类型处理流程
1. manifestBundleC.decode() 验证类型合法性
2. getFactory(modelType) 根据类型获取对应工厂
3. factory(instanceId, model, ...) 创建渲染对象
```

**类型处理特点**:
- 严格类型检查，防止无效数据
- 工厂模式按类型分发创建逻辑
- 支持扩展新的几何类型

##### 2. **id** - 对象身份管理
`id`字段是UVF中对象身份识别的核心：

```typescript
// ID处理机制
const processId = (manifestId: string, contextId?: string) => {
  // 1. 原始ID保存到 __manifestId
  model.__manifestId = manifestId;
  
  // 2. 根据上下文生成实际modelId
  const modelId = contextId ? `${contextId}:${manifestId}` : manifestId;
  
  // 3. 生成实例ID用于渲染
  const instanceId = instanceIdService.get(modelId);
  
  return { modelId, instanceId };
};
```

**ID体系分层**:
- **ManifestId**: 清单中的原始ID
- **ModelId**: 考虑上下文的模型ID  
- **InstanceId**: 渲染实例的唯一ID

**ID处理流程**:
```typescript
// 处理示例
{
  "id": "body00001_face00001",
  "type": "Face",
  "attributions": {
    "packedParentId": "body00001"  // 指向父几何体
  }
}

// 内部处理：
// 1. 验证ID格式和唯一性
// 2. 建立父子关系映射
// 3. 创建渲染实例关联
```

##### 3. **members** - 层次结构管理
`members`字段在`attributions`中定义对象间的包含关系：

```typescript
// 典型的组结构
{
  "id": "rootGroup",
  "type": "GeometryGroup", 
  "attributions": {
    "members": ["solidBody", "annotations", "measurements"]
  }
}
```

**Members处理机制**:

```typescript
// 组处理流程
const processGroupMembers = (group: GeometryGroupModel) => {
  const members = group.attributions?.members || [];
  
  // 1. 遍历成员ID
  for (const memberId of members) {
    // 2. 递归创建成员对象
    const memberInstanceId = await viewer.waitForFirstRender(memberId);
    
    // 3. 建立父子渲染关系
    parentRenderedGroup.add(memberRenderedObject);
    
    // 4. 应用组变换矩阵
    applyGroupTransform(memberRenderedObject, group.properties?.transform);
  }
};
```

**层次结构特性**:
- 支持无限嵌套的组结构
- 自动传播变换矩阵
- 批量属性继承和覆盖
- 高效的显示/隐藏控制

#### 数据处理完整流程

```typescript
// 1. 数据推送
messageService.push(manifestBundle);

// 2. 解码验证  
const decoded = manifestBundleC.decode(manifestBundle);

// 3. 遍历处理每个对象
for (const modelJson of manifestBundle) {
  // 4. ID处理和上下文转换
  const modelId = this.modelIdFromManifestId(modelJson.id);
  const contextModel = this.transformModelForContext(modelJson, modelId);
  
  // 5. 类型路由和工厂创建
  const factory = this.getFactory(contextModel.type);
  const rendered = await factory(instanceId, contextModel, ...);
  
  // 6. 建立层次关系
  if (contextModel.attributions?.members) {
    await this.processGroupMembers(contextModel);
  }
  
  // 7. 注册到场景管理
  this.scene.register(instanceId, rendered);
}
```

#### 信号系统 (Signals)
框架采用响应式编程模式：
- 属性变化自动触发重渲染
- 支持复杂的数据绑定
- 高效的更新机制

### 4. 资源管理与数据加载

#### Resources处理机制

UVF中的`Resources`定义了3D对象的二进制数据源，包括几何数据和场数据：

```typescript
export type Resources = {
  buffers?: BufferMeta | LODMeta;  // 几何缓冲区数据
  fields?: BufferMeta | LODMeta;   // 场数据缓冲区
  gltf?: GLTFMeta;                 // GLTF模型数据
};
```

**BufferMeta结构**:
```typescript
export type BufferMeta = {
  path: string;                    // 二进制文件路径
  sections: ReadonlyArray<BufferSection>;  // 数据段定义
  type: 'buffers';
};

export type BufferSection = {
  name?: string;      // 属性名称 (position, normal, pressure等)
  dimension?: number; // 数据维度 (1=标量, 3=向量)
  dType: string;      // 数据类型 (float32, uint16等)
  length: number;     // 数据长度
  offset: number;     // 文件内偏移量
};
```

**资源加载流程**:

1. **路径解析**: 从manifest的`resources.buffers.path`获取二进制文件路径
2. **分段优化**: 通过`consolidateSections()`合并相邻数据段，减少网络请求
3. **Range请求**: 使用HTTP Range头只加载需要的数据段
4. **并行加载**: 同时加载多个合并后的数据段

```typescript
// 核心加载代码示例
const { consolidatedSections, sectionToConsolidated } = this.consolidateSections(sections);
const consolidatedBuffers: ArrayBuffer[] = await Promise.all(
  consolidatedSections.map(({ length: bufferLength, offset: start }) =>
    this.rendererAdapter.getResource(path, {
      signal: abortSignal,
      pushToParentProgress,
      byteRange: { start, end: start + bufferLength - 1 }, // HTTP Range请求
    }),
  ),
);
```

**LOD支持**:
- 支持多层次细节(Level of Detail)通过`LODMeta`定义
- 根据视图距离和性能需求动态选择合适的LOD级别
- 自动管理不同LOD级别的资源加载

#### FieldController字段发现机制

`FieldController`负责科学数据字段的可视化，通过动态扫描机制发现可用字段：

**字段发现流程**:

1. **动态扫描**: `FieldController`访问`PackedGeometry.fieldNames` getter
2. **属性过滤**: 扫描已加载几何体的所有缓冲区属性
3. **类型排除**: 排除通用几何属性，识别科学数据字段

```typescript
// 字段名提取核心逻辑
public get fieldNames(): ReadonlyDeep<Set<string>> {
  const fieldNames = new Set<string>();
  
  // 遍历所有LOD级别的已加载几何体
  for (const [_lodLevel, packedGeometries] of this.packedGeometries) {
    for (const packedGeometry of packedGeometries) {
      // 扫描所有缓冲区属性
      for (const [name] of Object.entries(packedGeometry)) {
        // 排除通用属性类型
        if (!commonBufferAttributeTypes.has(name)) {
          fieldNames.add(name);
        }
      }
    }
  }
  
  return fieldNames;
}
```

**通用属性过滤**:
```typescript
const commonBufferAttributeTypes = new Set([
  'position',      // 顶点位置
  'normal',        // 法向量  
  'indices',       // 索引
  'color',         // 颜色
  'edgePosition',  // 边线位置
  'edgeIndices'    // 边线索引
]);
```

**字段数据访问**:
- 通过`getFieldBuffer(fieldName: string)`获取字段的缓冲区数据
- 数据来源于manifest中`resources.fields`或`resources.buffers`的对应sections
- 支持标量场、向量场等多种科学数据类型

**控制器管理**:
```typescript
// 使用静态WeakMap确保每个PackedGeometry只有一个FieldController
private static fieldControllerLookup = new WeakMap<
  PackedGeometry<PackedGeometryModel>,
  FieldController<PackedGeometryModel>
>();
```

这种设计实现了：
- 高效的按需数据加载
- 动态字段发现和管理
- 内存友好的实例管理
- 支持大型科学数据集的可视化

## 应用层面分析

### 1. 典型使用场景

根据Stories分析，UVF主要应用于以下场景：

#### 工程可视化
- **复杂模型展示**: 飞机、轮船、机械部件等
- **CAD数据可视化**: 支持边线、面、体的渲染
- **装配体管理**: 通过GroupManager进行组件管理

#### 科学计算可视化
- **CFD结果展示**: 流场、压力场、温度场等
- **流线可视化**: 支持流线动画和方向控制
- **等值面渲染**: 多种颜色映射方案
- **Q-Criterion可视化**: 涡流结构识别

#### 交互式分析
- **选择和高亮**: 支持对象选择和悬停效果
- **测量和标注**: 长度、面积、体积测量
- **视角控制**: 聚焦、缩放、旋转
- **性能监控**: 实时性能统计

### 2. 开发模式

#### Story驱动开发
UVF采用Storybook作为开发和测试平台：
- 每个功能都有对应的Story
- 支持参数化测试
- 提供实时预览和调试

#### 沙箱环境
```typescript
// 典型的Story结构
export const Default: Story = {
  render: injectVisualizationSandbox((_args, { visualizationSandbox: { viewer, messageService } }) => {
    // 1. 推送Manifest数据
    messageService.push(manifestData as ManifestBundle);
    
    // 2. 等待渲染完成
    await viewer.show(viewer.scene.allInstanceIds);
    await viewer.waitForFirstRender(instanceId);
    
    // 3. 配置和交互
    const fieldController = viewer.getOrCreateFieldController(instanceId);
    fieldController.fieldName.set('pressure');
    
    return viewer.container;
  }),
};
```

### 3. 扩展机制

#### 插件系统
- **Loaders**: 支持多种数据格式
- **Renderers**: 可扩展的渲染器
- **Controllers**: 自定义控制器

#### 适配器模式
- Three.js适配器用于底层渲染
- 支持其他渲染引擎的扩展

## 快速上手指南

### 1. 基础设置

```typescript
import { ThreeViewer } from '@flexcompute/uvf';

// 创建查看器
const viewer = new ThreeViewer(container, {
  loaders: {
    getResource: async (url) => fetch(url)
  }
});

// 创建消息服务
const messageService = new Subject<ManifestBundle>();
```

### 2. 加载数据

```typescript
// 推送Manifest数据
messageService.push(manifestData);

// 显示所有对象
await viewer.show(viewer.scene.allInstanceIds);

// 等待渲染完成
await viewer.waitForFirstRender(objectId);
```

### 3. 配置可视化

```typescript
// 场域可视化
const fieldController = viewer.getOrCreateFieldController(instanceId);
fieldController.fieldName.set('velocity');
fieldController.isLogScale.set(true);

// 环境设置
viewer.environmentController.background = {
  type: 'gradient',
  gradientTop: '#87CEEB',
  gradientBottom: '#98FB98'
};
```

### 4. 添加交互

```typescript
// 启用选择
viewer.selectionEnabled.set(true);

// 监听选择变化
effect(() => {
  const selected = viewer.selected.values();
  console.log('Selected objects:', selected);
});

// 添加注释
const textSprite = viewer.scene.create.textSprite();
textSprite.propertySignals.text.set('重要位置');
textSprite.propertySignals.position?.set([0, 0, 0]);
```

## 最佳实践

### 1. 性能优化
- 使用LOD (Level of Detail) 管理复杂模型
- 合理使用组管理器批量操作
- 避免频繁的属性更新

### 2. 数据管理
- Manifest结构要清晰合理
- 使用适当的数据类型
- 考虑数据的增量更新

### 3. 交互设计
- 提供清晰的视觉反馈
- 合理设置选择和悬停效果
- 考虑用户体验的连贯性

## 总结

UVF是一个功能强大、架构清晰的3D可视化框架，特别适合工程和科学数据的可视化需求。其Manifest驱动的架构、响应式的信号系统、以及丰富的控制器组件，为开发者提供了灵活而强大的工具。通过Stories系统的学习和实践，开发者可以快速掌握框架的使用方法，构建出高质量的3D可视化应用。