# UVF 框架使用指南与实战示例

基于前面对 UVF (Unified Visualization Framework) 的深入研读，本文档将通过一个完整的实际案例来展示如何使用这个强大的 3D 可视化框架。

## 📋 框架概述

UVF 是一个基于 TypeScript 和 Three.js 的统一可视化框架，核心特性包括：

- **🎮 Controller 层**：场景控制、几何管理、材质控制、用户交互
- **📊 Manifest 数据层**：类型安全的数据模型、信号驱动的响应式编程
- **🎨 Rendering 渲染层**：WebGL 渲染、材质系统、效果管道、性能优化
- **🛠️ Utils 工具库**：高性能工具函数、异步控制、数学运算

## 🎯 实战案例：科学数据可视化系统

让我们构建一个完整的科学数据可视化系统，用于展示流体力学仿真结果。

### 1. 项目初始化

```bash
# 安装 UVF 框架
pnpm install @flexcompute/uvf

# 项目结构
src/
├── FluidVisualization.ts      # 主可视化类
├── DataProcessor.ts           # 数据处理器
├── FieldController.ts         # 场控制器
├── InteractionManager.ts      # 交互管理器
└── types.ts                   # 类型定义
```

### 2. 类型定义

```typescript
// types.ts
import type { ManifestBundle, Vector3Json, ManifestObjectId } from '@flexcompute/uvf';

export interface FluidSimulationData {
  id: string;
  timestamp: number;
  velocity: Vector3Json[];
  pressure: number[];
  temperature: number[];
  positions: Vector3Json[];
  boundingBox: {
    min: Vector3Json;
    max: Vector3Json;
  };
}

export interface VisualizationConfig {
  showVelocityField: boolean;
  showPressureContours: boolean;
  showTemperatureMap: boolean;
  enableInteraction: boolean;
  colormap: 'Viridis' | 'Plasma' | 'Jet';
  clipPlane?: {
    normal: Vector3Json;
    position: Vector3Json;
  };
}

export interface FluidVisualizationEvents {
  onDataLoaded: (data: FluidSimulationData) => void;
  onFieldChanged: (fieldName: string, value: any) => void;
  onObjectSelected: (objectId: ManifestObjectId) => void;
}
```

### 3. 数据处理器

```typescript
// DataProcessor.ts
import { 
  createIDFromPath, 
  deepClone, 
  fillPattern,
  type ManifestBundle 
} from '@flexcompute/uvf';

export class FluidDataProcessor {
  private abortController = new AbortController();

  /**
   * 将原始仿真数据转换为 UVF Manifest 格式
   */
  async processSimulationData(
    rawData: FluidSimulationData,
    signal?: AbortSignal
  ): Promise<ManifestBundle> {
    const combinedSignal = signal ? 
      AbortSignal.any([this.abortController.signal, signal]) : 
      this.abortController.signal;

    try {
      // 生成唯一的模型ID
      const modelId = createIDFromPath(['fluid-simulation', rawData.id]);
      
      // 处理几何数据
      const geometry = await this.createGeometryManifest(rawData, combinedSignal);
      
      // 处理场数据
      const fieldData = await this.createFieldManifest(rawData, combinedSignal);
      
      // 创建材质配置
      const material = this.createMaterialManifest(rawData);

      return [
        {
          id: modelId,
          type: 'packedGeometry',
          geometry,
          material,
          fields: fieldData,
          attributions: {
            timestamp: rawData.timestamp,
            source: 'fluid-simulation'
          }
        }
      ];
    } catch (error) {
      if (combinedSignal.aborted) {
        throw new Error('Data processing aborted');
      }
      throw error;
    }
  }

  private async createGeometryManifest(
    data: FluidSimulationData, 
    signal: AbortSignal
  ) {
    // 使用高性能填充工具
    const vertexCount = data.positions.length;
    const positionBuffer = new Float32Array(vertexCount * 3);
    
    // 高效填充位置数据
    for (let i = 0; i < vertexCount; i++) {
      const offset = i * 3;
      positionBuffer[offset] = data.positions[i][0];
      positionBuffer[offset + 1] = data.positions[i][1];
      positionBuffer[offset + 2] = data.positions[i][2];
      
      // 检查中断信号
      if (i % 1000 === 0 && signal.aborted) {
        throw new Error('Geometry processing aborted');
      }
    }

    return {
      type: 'mesh',
      vertices: Array.from(positionBuffer),
      indices: this.generateIndices(vertexCount),
      normals: this.calculateNormals(data.positions),
    };
  }

  private async createFieldManifest(
    data: FluidSimulationData,
    signal: AbortSignal
  ) {
    const fields = {};

    // 处理速度场
    if (data.velocity.length > 0) {
      fields['velocity'] = {
        type: 'vector',
        data: data.velocity.flat(),
        component: 'magnitude'
      };
    }

    // 处理压力场
    if (data.pressure.length > 0) {
      fields['pressure'] = {
        type: 'scalar',
        data: data.pressure,
        unit: 'Pa'
      };
    }

    // 处理温度场
    if (data.temperature.length > 0) {
      fields['temperature'] = {
        type: 'scalar',
        data: data.temperature,
        unit: 'K'
      };
    }

    return fields;
  }

  private createMaterialManifest(data: FluidSimulationData) {
    return {
      type: 'standard',
      color: [0.7, 0.8, 0.9],
      metalness: 0.1,
      roughness: 0.8,
      transparent: true,
      opacity: 0.9
    };
  }

  private generateIndices(vertexCount: number): number[] {
    // 简化：生成三角形索引
    const indices = [];
    for (let i = 0; i < vertexCount - 2; i += 3) {
      indices.push(i, i + 1, i + 2);
    }
    return indices;
  }

  private calculateNormals(positions: Vector3Json[]): number[] {
    // 简化：计算表面法线
    const normals = new Array(positions.length * 3);
    fillPattern([0, 0, 1], normals); // 默认向上法线
    return normals;
  }

  dispose(): void {
    this.abortController.abort();
  }
}
```

### 4. 场控制器

```typescript
// FieldController.ts
import { 
  FieldController as UVFFieldController,
  FieldComponent,
  ContourLineType,
  ClipType
} from '@flexcompute/uvf';

export class FluidFieldController {
  private fieldController: UVFFieldController;
  private currentField: string = 'velocity';

  constructor(
    private viewer: any,
    private instanceId: string
  ) {
    this.fieldController = viewer.getOrCreateFieldController(instanceId);
    this.setupDefaultConfiguration();
  }

  private setupDefaultConfiguration(): void {
    // 设置默认颜色映射
    this.fieldController.colormapName = 'Viridis';
    
    // 配置等值线
    this.fieldController.contourSteps = 10;
    this.fieldController.contourLineType = ContourLineType.UseColormap;
    
    // 设置对数缩放
    this.fieldController.isLogScale.set(false);
  }

  /**
   * 切换显示场
   */
  async switchField(fieldName: string): Promise<void> {
    try {
      this.currentField = fieldName;
      this.fieldController.fieldName.set(fieldName);
      
      // 根据场类型调整显示参数
      switch (fieldName) {
        case 'velocity':
          this.fieldController.fieldComponent = FieldComponent.Magnitude;
          this.fieldController.isLogScale.set(false);
          break;
          
        case 'pressure':
          this.fieldController.fieldComponent = FieldComponent.Scalar;
          this.fieldController.isLogScale.set(true);
          break;
          
        case 'temperature':
          this.fieldController.fieldComponent = FieldComponent.Scalar;
          this.fieldController.isLogScale.set(false);
          break;
      }

      // 应用到实例
      this.fieldController.assignFieldToInstance();
    } catch (error) {
      console.error('Failed to switch field:', error);
      throw error;
    }
  }

  /**
   * 设置颜色映射范围
   */
  setColorRange(min: number, max: number): void {
    this.fieldController.minMaxScalar = [min, max];
    this.fieldController.assignFieldToInstance();
  }

  /**
   * 启用/禁用等值线
   */
  toggleContourLines(enabled: boolean, steps: number = 10): void {
    this.fieldController.contourSteps = enabled ? steps : 0;
    this.fieldController.assignFieldToInstance();
  }

  /**
   * 设置剪切平面
   */
  setClipPlane(normal: Vector3Json, position: Vector3Json): void {
    this.fieldController.clipType = ClipType.Plane;
    this.fieldController.clipPlaneNormal = normal;
    this.fieldController.clipPlanePosition = position;
    this.fieldController.assignFieldToInstance();
  }

  /**
   * 移除剪切
   */
  removeClipping(): void {
    this.fieldController.clipType = ClipType.None;
    this.fieldController.assignFieldToInstance();
  }

  getCurrentField(): string {
    return this.currentField;
  }

  dispose(): void {
    // 清理资源
  }
}
```

### 5. 交互管理器

```typescript
// InteractionManager.ts
import { 
  WaitController, 
  asyncInterval,
  screenToNDC,
  type Vector3Json 
} from '@flexcompute/uvf';

export class FluidInteractionManager {
  private animationController?: AbortController;
  private selectionController = new WaitController<string>();

  constructor(
    private viewer: any,
    private container: HTMLElement,
    private onSelectionChanged: (objectId: string | null) => void
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // 鼠标点击选择
    this.container.addEventListener('click', this.handleClick.bind(this));
    
    // 键盘控制
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // 双击重置视图
    this.container.addEventListener('dblclick', this.resetView.bind(this));
  }

  private async handleClick(event: MouseEvent): Promise<void> {
    try {
      const rect = this.container.getBoundingClientRect();
      const ndcCoords = screenToNDC(event.clientX, event.clientY, rect);
      
      // 执行射线投射选择
      const selectedObject = await this.performRaycast(ndcCoords.x, ndcCoords.y);
      
      if (selectedObject) {
        this.onSelectionChanged(selectedObject.id);
        this.highlightObject(selectedObject.id);
      } else {
        this.onSelectionChanged(null);
        this.clearHighlights();
      }
    } catch (error) {
      console.error('Selection failed:', error);
    }
  }

  private async performRaycast(x: number, y: number): Promise<any> {
    // 使用 UVF 的射线投射功能
    const raycaster = this.viewer.raycaster;
    const camera = this.viewer.camera;
    
    raycaster.setFromCamera({ x, y }, camera);
    const intersects = raycaster.intersectObjects(this.viewer.scene.children, true);
    
    return intersects.length > 0 ? intersects[0].object : null;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'r':
      case 'R':
        this.resetView();
        break;
        
      case 'w':
      case 'W':
        this.toggleWireframe();
        break;
        
      case 'Space':
        event.preventDefault();
        this.toggleAnimation();
        break;
    }
  }

  private async resetView(): Promise<void> {
    try {
      await this.viewer.zoomToFit(Array.from(this.viewer.scene.allInstanceIds));
    } catch (error) {
      console.error('Failed to reset view:', error);
    }
  }

  private toggleWireframe(): void {
    // 切换线框模式
    this.viewer.scene.children.forEach((child: any) => {
      if (child.material) {
        child.material.wireframe = !child.material.wireframe;
      }
    });
  }

  private toggleAnimation(): void {
    if (this.animationController) {
      this.animationController.abort();
      this.animationController = undefined;
    } else {
      this.startRotationAnimation();
    }
  }

  private startRotationAnimation(): void {
    this.animationController = asyncInterval(
      async (signal) => {
        if (!signal.aborted) {
          const camera = this.viewer.camera;
          camera.rotateY(0.01); // 缓慢旋转
        }
      },
      { intervalTime: 16 } // ~60 FPS
    );
  }

  private highlightObject(objectId: string): void {
    // 高亮显示选中对象
    const object = this.viewer.scene.getObjectById(objectId);
    if (object && object.material) {
      object.material.emissive.setHex(0x444444);
    }
  }

  private clearHighlights(): void {
    // 清除所有高亮
    this.viewer.scene.children.forEach((child: any) => {
      if (child.material && child.material.emissive) {
        child.material.emissive.setHex(0x000000);
      }
    });
  }

  dispose(): void {
    this.animationController?.abort();
    this.container.removeEventListener('click', this.handleClick);
    this.container.removeEventListener('dblclick', this.resetView);
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}
```

### 6. 主可视化类

```typescript
// FluidVisualization.ts
import { 
  ThreeViewer,
  MessageService,
  type ManifestBundle,
  type ManifestObjectId,
  createWatermarkElement,
  abortControllerFactory
} from '@flexcompute/uvf';

export class FluidVisualization {
  private viewer: ThreeViewer;
  private messageService: MessageService;
  private dataProcessor: FluidDataProcessor;
  private fieldController?: FluidFieldController;
  private interactionManager?: FluidInteractionManager;
  private abortController: AbortController;
  private disposeCallbacks: (() => void)[] = [];

  constructor(
    private container: HTMLElement,
    private config: VisualizationConfig,
    private events: Partial<FluidVisualizationEvents> = {}
  ) {
    [this.abortController] = abortControllerFactory();
    this.initialize();
  }

  private initialize(): void {
    try {
      // 创建消息服务
      this.messageService = new MessageService();
      
      // 创建查看器
      this.viewer = new ThreeViewer({
        container: this.container,
        messageService: this.messageService,
        abortSignal: this.abortController.signal
      });

      // 初始化数据处理器
      this.dataProcessor = new FluidDataProcessor();

      // 设置环境
      this.setupEnvironment();
      
      // 添加水印（开发环境）
      if (process.env.NODE_ENV === 'development') {
        const watermark = createWatermarkElement({ position: 'bottom-right' });
        this.container.appendChild(watermark);
      }

      this.disposeCallbacks.push(() => {
        this.dataProcessor.dispose();
        this.fieldController?.dispose();
        this.interactionManager?.dispose();
        this.viewer.dispose();
      });

    } catch (error) {
      console.error('Failed to initialize FluidVisualization:', error);
      throw error;
    }
  }

  private setupEnvironment(): void {
    // 设置相机
    this.viewer.camera.position.set(10, 10, 10);
    this.viewer.camera.lookAt(0, 0, 0);

    // 设置灯光
    const ambientLight = this.viewer.scene.create.ambientLight({
      color: 0x404040,
      intensity: 0.4
    });

    const directionalLight = this.viewer.scene.create.directionalLight({
      color: 0xffffff,
      intensity: 0.8,
      position: [10, 10, 5]
    });

    // 添加坐标轴
    const origin = this.viewer.scene.create.originPoint();
    origin.propertySignals.color?.set(0xff0000);
  }

  /**
   * 加载仿真数据
   */
  async loadSimulationData(data: FluidSimulationData): Promise<void> {
    try {
      // 处理数据
      const manifestBundle = await this.dataProcessor.processSimulationData(
        data, 
        this.abortController.signal
      );

      // 推送到消息服务
      this.messageService.push(manifestBundle);

      // 等待渲染完成
      const instanceIds = Array.from(this.viewer.scene.allInstanceIds);
      await this.viewer.show(instanceIds);
      
      // 等待首次渲染
      await Promise.all(
        instanceIds.map(id => this.viewer.waitForFirstRender(id))
      );

      // 创建场控制器
      if (instanceIds.length > 0) {
        this.fieldController = new FluidFieldController(
          this.viewer, 
          instanceIds[0]
        );

        // 设置交互管理器
        this.interactionManager = new FluidInteractionManager(
          this.viewer,
          this.container,
          (objectId) => this.events.onObjectSelected?.(objectId as ManifestObjectId)
        );
      }

      // 调整视图
      await this.viewer.zoomToFit(instanceIds);

      // 触发事件
      this.events.onDataLoaded?.(data);

    } catch (error) {
      console.error('Failed to load simulation data:', error);
      throw error;
    }
  }

  /**
   * 更新可视化配置
   */
  async updateConfig(newConfig: Partial<VisualizationConfig>): Promise<void> {
    Object.assign(this.config, newConfig);

    if (this.fieldController) {
      // 根据配置更新场显示
      if (this.config.showVelocityField) {
        await this.fieldController.switchField('velocity');
      } else if (this.config.showPressureContours) {
        await this.fieldController.switchField('pressure');
        this.fieldController.toggleContourLines(true, 15);
      } else if (this.config.showTemperatureMap) {
        await this.fieldController.switchField('temperature');
      }

      // 应用剪切平面
      if (this.config.clipPlane) {
        this.fieldController.setClipPlane(
          this.config.clipPlane.normal,
          this.config.clipPlane.position
        );
      } else {
        this.fieldController.removeClipping();
      }
    }
  }

  /**
   * 导出场景截图
   */
  async exportScreenshot(
    width: number = 1920, 
    height: number = 1080
  ): Promise<string> {
    try {
      return await this.viewer.exportScreenshot(width, height);
    } catch (error) {
      console.error('Failed to export screenshot:', error);
      throw error;
    }
  }

  /**
   * 获取场数据统计
   */
  getFieldStatistics(fieldName: string): any {
    if (!this.fieldController) {
      throw new Error('No field controller available');
    }

    return {
      min: this.fieldController.fieldController.getPercentile(0),
      max: this.fieldController.fieldController.getPercentile(100),
      median: this.fieldController.fieldController.getPercentile(50),
      q1: this.fieldController.fieldController.getPercentile(25),
      q3: this.fieldController.fieldController.getPercentile(75)
    };
  }

  /**
   * 获取当前显示的场
   */
  getCurrentField(): string | undefined {
    return this.fieldController?.getCurrentField();
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.abortController.abort();
    this.disposeCallbacks.forEach(dispose => dispose());
    this.disposeCallbacks.length = 0;
  }
}
```

### 7. 使用示例

```typescript
// 使用示例
import { FluidVisualization } from './FluidVisualization';

async function createFluidVisualizationDemo() {
  const container = document.getElementById('visualization-container')!;
  
  // 配置
  const config: VisualizationConfig = {
    showVelocityField: true,
    showPressureContours: false,
    showTemperatureMap: false,
    enableInteraction: true,
    colormap: 'Viridis'
  };

  // 事件处理
  const events: FluidVisualizationEvents = {
    onDataLoaded: (data) => {
      console.log('数据加载完成:', data.id);
      updateUI();
    },
    onFieldChanged: (fieldName, value) => {
      console.log('场变化:', fieldName, value);
    },
    onObjectSelected: (objectId) => {
      console.log('对象选中:', objectId);
      showObjectDetails(objectId);
    }
  };

  // 创建可视化实例
  const visualization = new FluidVisualization(container, config, events);

  // 模拟数据
  const simulationData: FluidSimulationData = {
    id: 'turbulent-flow-t0001',
    timestamp: Date.now(),
    velocity: generateVelocityField(1000),
    pressure: generatePressureField(1000),
    temperature: generateTemperatureField(1000),
    positions: generatePositions(1000),
    boundingBox: {
      min: [-5, -5, -5],
      max: [5, 5, 5]
    }
  };

  // 加载数据
  await visualization.loadSimulationData(simulationData);

  // 创建控制界面
  createControlPanel(visualization);

  return visualization;
}

function createControlPanel(visualization: FluidVisualization) {
  const panel = document.createElement('div');
  panel.className = 'control-panel';
  panel.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 20px;
    border-radius: 8px;
    font-family: monospace;
  `;

  // 场切换按钮
  const fieldButtons = ['velocity', 'pressure', 'temperature'].map(field => {
    const button = document.createElement('button');
    button.textContent = field;
    button.onclick = async () => {
      await visualization.updateConfig({ 
        showVelocityField: field === 'velocity',
        showPressureContours: field === 'pressure',
        showTemperatureMap: field === 'temperature'
      });
    };
    return button;
  });

  // 导出按钮
  const exportButton = document.createElement('button');
  exportButton.textContent = '导出截图';
  exportButton.onclick = async () => {
    const dataUrl = await visualization.exportScreenshot();
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'fluid-visualization.png';
    link.click();
  };

  // 添加控件
  fieldButtons.forEach(btn => panel.appendChild(btn));
  panel.appendChild(exportButton);
  document.body.appendChild(panel);
}

// 辅助函数
function generateVelocityField(count: number): Vector3Json[] {
  return Array.from({ length: count }, () => [
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  ]);
}

function generatePressureField(count: number): number[] {
  return Array.from({ length: count }, () => Math.random() * 1000);
}

function generateTemperatureField(count: number): number[] {
  return Array.from({ length: count }, () => 273 + Math.random() * 100);
}

function generatePositions(count: number): Vector3Json[] {
  return Array.from({ length: count }, () => [
    Math.random() * 10 - 5,
    Math.random() * 10 - 5,
    Math.random() * 10 - 5
  ]);
}

// 启动应用
createFluidVisualizationDemo().then(visualization => {
  console.log('流体可视化系统已启动');
  
  // 在页面卸载时清理
  window.addEventListener('beforeunload', () => {
    visualization.dispose();
  });
}).catch(error => {
  console.error('启动失败:', error);
});
```

## 🎯 关键特性展示

### 1. **响应式架构**
- 使用信号系统实现数据驱动的 UI 更新
- 支持异步操作的中断和清理
- 内存安全的资源管理

### 2. **高性能渲染**
- WebGL 加速的 3D 渲染
- 支持大规模数据集的可视化
- 智能的 LOD (Level of Detail) 管理

### 3. **灵活的场可视化**
- 多种场类型支持（标量场、矢量场）
- 丰富的可视化方式（等值线、体渲染、流线）
- 实时的颜色映射和范围调整

### 4. **强大的交互能力**
- 直观的 3D 导航控制
- 精确的对象选择和高亮
- 键盘快捷键支持

### 5. **开发者友好**
- 完整的 TypeScript 类型支持
- 丰富的调试工具和错误处理
- 模块化的架构设计

## 💡 最佳实践总结

1. **性能优化**：使用 UVF 提供的高性能工具函数，避免不必要的数据复制
2. **内存管理**：及时调用 dispose 方法清理资源，使用 AbortController 管理异步操作
3. **类型安全**：充分利用 TypeScript 类型系统，使用 Manifest 数据模型
4. **错误处理**：实现完善的错误处理和用户反馈机制
5. **可扩展性**：采用插件化架构，便于功能扩展和定制

UVF 框架提供了构建专业级 3D 可视化应用所需的所有工具和抽象，通过合理的架构设计和最佳实践，可以快速构建出高性能、可维护的可视化解决方案。
