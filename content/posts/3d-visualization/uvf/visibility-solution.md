---
title: "UVF可见性控制解决方案总结"
date: 2025-08-30T23:04:28+08:00
draft: false
description: "UVF可见性控制解决方案总结"
tags: 
  - "可视化"
  - "3D"
  - "文档"
  - "UVF"
categories:
  - "UVF"
---

# UVF可见性控制解决方案总结

## 问题需求
用户询问："如何通过一个manifestID，让里面除了这个manifestID，其余都隐藏"

## 解决方案

我已经为UVF框架创建了一套完整的可见性控制工具函数，可以实现通过ManifestId来控制3D对象的显示和隐藏。

### 核心文件

1. **工具函数模块**: `/src/utils/visibilityUtils.ts`
2. **使用文档**: `/src/utils/visibilityUtils.md`  
3. **演示示例**: `/storybook/stories/examples/VisibilityControl.stories.ts`

### 主要功能

#### 1. `hideAllExcept(viewer, targetManifestId, updateScene?)`
- **功能**: 隐藏除了指定manifestId之外的所有其他对象
- **实现原理**: 
  - 获取目标manifest的所有实例ID
  - 获取场景中的所有实例ID
  - 筛选出需要隐藏的实例ID（排除目标manifest的实例）
  - 批量调用viewer.hide()隐藏其他对象

#### 2. `showOnlyTarget(viewer, targetManifestId, updateScene?)`
- **功能**: 只显示指定manifestId的对象，隐藏其他所有对象
- **实现原理**:
  - 先隐藏所有对象
  - 然后只显示目标对象
  - 统一更新场景

#### 3. `getOtherInstanceIds(viewer, excludeManifestId)`
- **功能**: 获取除了指定manifestId之外的所有其他实例ID
- **用途**: 可用于其他自定义操作

#### 4. `toggleIsolateObject(viewer, targetManifestId, updateScene?)`
- **功能**: 切换显示模式：只显示目标对象 vs 显示所有对象
- **智能判断**: 自动检测当前状态并切换

### 技术要点

#### UVF框架中的ID系统
- **ManifestObjectId**: 清单对象的唯一标识符
- **ObjectInstanceId**: 实例ID，一个ManifestObjectId可能对应多个实例
- **Scene.allInstanceIds**: 获取场景中所有实例ID
- **Scene.getInstanceIds(manifestId)**: 获取指定manifest的所有实例ID

#### 关键API调用
```typescript
// 获取所有实例ID
const allInstanceIds = Array.from(viewer.scene.allInstanceIds);

// 获取特定manifest的实例ID
const targetInstanceIds = viewer.scene.getInstanceIds(manifestId);

// 批量隐藏/显示
await viewer.hide(instanceIds, updateScene);
await viewer.show(instanceIds, options);

// 检查可见性
const isVisible = viewer.isVisible(instanceId);
```

### 使用示例

```typescript
import { hideAllExcept } from '@/utils/visibilityUtils';

// 隐藏除了'target_object'之外的所有对象
await hideAllExcept(viewer, 'target_object' as ManifestObjectId);
```

### 性能优化

1. **批量操作**: 支持设置`updateScene=false`来避免多次场景更新
2. **高效筛选**: 使用Set数据结构进行快速查找和过滤
3. **异步操作**: 所有函数都是异步的，不会阻塞UI

### 演示Story

创建了4个Storybook演示：
1. **HideAllExceptDemo**: 基本隐藏其他对象功能
2. **ShowOnlyTargetDemo**: 只显示目标对象功能
3. **ToggleIsolateDemo**: 切换隔离模式功能
4. **InteractiveIsolateDemo**: 交互式UI控制面板

### 扩展性

这套工具函数设计时考虑了扩展性：
- 函数接口简洁明了
- 支持自定义更新策略
- 可以轻松集成到现有的UVF应用中
- 遵循UVF框架的设计模式和最佳实践

## 总结

通过这套解决方案，用户可以轻松实现：
- ✅ 通过ManifestId隐藏其他所有对象
- ✅ 只显示指定的对象
- ✅ 切换隔离显示模式
- ✅ 获取其他对象的实例ID进行自定义操作

所有功能都经过TypeScript类型检查，确保类型安全，并提供了完整的文档和使用示例。
