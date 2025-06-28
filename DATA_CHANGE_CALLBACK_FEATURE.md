# 数据变更回调功能实现

## 2024-07-01 链路增强变更记录

- DataChangeInfo 结构增加 idChainNodes、parentIdChainNodes 字段，分别表示当前节点链路和父节点链路的节点对象数组。
- 所有操作（包括撤销/重做）均补充 currentNode、parentNode、idChain、parentIdChain、idChainNodes、parentIdChainNodes 信息。
- 外部可直接获取操作节点及其所有祖先节点对象，极大方便业务扩展和链路分析。

---

## 功能概述

本次优化为思维导图组件添加了详细的数据变更回调功能，使得每次操作（撤销、重做、添加节点、添加子节点、删除节点等）都能获取到最新的数据，包括整个数据以及当前增加节点、删除节点的数据。

## 实现的功能

### 1. 详细的数据变更回调
- **操作类型识别**: 支持7种操作类型的识别和回调
- **完整数据获取**: 每次操作都能获取操作前后的完整数据
- **节点信息追踪**: 精确追踪新增、删除、更新的节点信息
- **时间戳记录**: 记录每次操作的时间戳
- **操作描述**: 提供人类可读的操作描述

### 2. 支持的操作类型

| 操作类型 | 描述 | 获取的数据 |
|---------|------|-----------|
| `ADD_NODE` | 添加节点 | 新增的节点信息、受影响的节点ID |
| `DELETE_NODE` | 删除节点 | 删除的节点信息、受影响的节点ID |
| `UPDATE_NODE_TEXT` | 更新节点文本 | 更新的节点信息、受影响的节点ID |
| `TOGGLE_NODE_COLLAPSE` | 切换节点折叠状态 | 更新的节点信息、受影响的节点ID |
| `UNDO` | 撤销操作 | 操作前后的完整数据 |
| `REDO` | 重做操作 | 操作前后的完整数据 |
| `LOAD_DATA` | 加载数据 | 初始数据信息 |

### 3. 数据变更信息结构

```typescript
interface DataChangeInfo {
  operationType: OperationType;        // 操作类型
  timestamp: number;                   // 操作时间戳
  affectedNodeIds?: string[];          // 受影响的节点ID列表
  addedNodes?: MindMapNode[];          // 新增的节点列表
  deletedNodes?: MindMapNode[];        // 删除的节点列表
  updatedNodes?: MindMapNode[];        // 更新的节点列表
  previousData?: MindMapNode | null;   // 操作前的完整数据
  currentData: MindMapNode | null;     // 操作后的完整数据
  description: string;                 // 操作描述
  currentNode?: MindMapNode;           // 当前操作的节点
  parentNode?: MindMapNode;            // 当前操作的父节点
  idChain?: string[];                  // 当前节点链路
  parentIdChain?: string[];            // 父节点链路
  idChainNodes?: MindMapNode[];         // 当前节点链路的节点对象数组
  parentIdChainNodes?: MindMapNode[];   // 父节点链路的节点对象数组
}
```

## 技术实现

### 1. 类型定义扩展
- 在 `types.ts` 中添加了 `OperationType` 枚举
- 定义了 `DataChangeInfo` 接口
- 定义了 `DataChangeCallback` 回调函数类型

### 2. 状态管理优化
- 在 `useMindMap.ts` 中添加了数据变更回调支持
- 为每个操作函数添加了回调触发逻辑
- 实现了操作前后状态的保存和比较

### 3. 组件接口扩展
- 在 `ReactMindMap.tsx` 中添加了 `onDataChangeDetailed` 属性
- 保持了向后兼容性，原有的 `onDataChange` 仍然可用

### 4. 示例应用
- 在 `App.tsx` 中实现了完整的示例
- 添加了操作日志面板，实时显示所有操作
- 展示了如何使用新的回调功能

## 使用方法

### 基础使用
```typescript
import { ReactMindMap, type DataChangeInfo, OperationType } from './lib';

const handleDataChangeDetailed = (changeInfo: DataChangeInfo) => {
  console.log('数据变更详情:', changeInfo);
  
  // 根据操作类型进行不同的处理
  switch (changeInfo.operationType) {
    case OperationType.ADD_NODE:
      console.log('新增节点:', changeInfo.addedNodes);
      break;
    case OperationType.DELETE_NODE:
      console.log('删除节点:', changeInfo.deletedNodes);
      break;
    // ... 其他操作类型
  }
  
  // 获取完整的当前数据
  console.log('当前完整数据:', changeInfo.currentData);
};

const mindMapProps = {
  initialData: data,
  onDataChangeDetailed: handleDataChangeDetailed,
  // ... 其他配置
};
```

### 高级用法
```typescript
// 实现数据持久化
const handleDataChangeDetailed = (changeInfo: DataChangeInfo) => {
  // 保存到本地存储
  localStorage.setItem('mindMapData', JSON.stringify(changeInfo.currentData));
  
  // 发送到服务器
  if (changeInfo.operationType !== OperationType.LOAD_DATA) {
    api.saveMindMap(changeInfo.currentData);
  }
  
  // 记录操作日志
  logOperation(changeInfo);
};

// 实现协同编辑
const handleDataChangeDetailed = (changeInfo: DataChangeInfo) => {
  // 广播变更到其他用户
  socket.emit('mindMapChange', {
    operationType: changeInfo.operationType,
    affectedNodeIds: changeInfo.affectedNodeIds,
    addedNodes: changeInfo.addedNodes,
    deletedNodes: changeInfo.deletedNodes,
    updatedNodes: changeInfo.updatedNodes,
  });
};
```

## 优势特性

### 1. 完整性
- 提供操作前后的完整数据对比
- 支持所有主要操作类型的追踪
- 包含详细的节点信息

### 2. 灵活性
- 可以根据操作类型进行不同的处理
- 支持自定义的数据处理逻辑
- 向后兼容，不影响现有功能

### 3. 实时性
- 操作完成后立即触发回调
- 提供准确的时间戳信息
- 支持实时数据同步

### 4. 可扩展性
- 易于添加新的操作类型
- 支持复杂的数据处理逻辑
- 为后续功能扩展提供基础

## 应用场景

### 1. 数据持久化
- 自动保存用户操作
- 实现撤销/重做功能
- 数据备份和恢复

### 2. 协同编辑
- 实时同步多用户操作
- 冲突检测和解决
- 操作历史记录

### 3. 数据分析
- 用户行为分析
- 操作模式统计
- 性能优化

### 4. 调试和监控
- 操作日志记录
- 错误追踪
- 性能监控

## 总结

本次功能优化为思维导图组件提供了强大的数据变更追踪能力，使得开发者能够：

1. **精确追踪每次操作**: 获取操作类型、影响范围、变更内容
2. **获取完整数据**: 操作前后的完整数据结构
3. **实现复杂功能**: 数据持久化、协同编辑、操作分析
4. **保持兼容性**: 不影响现有功能，向后兼容

这个功能为思维导图组件的进一步扩展和应用提供了坚实的基础，支持更复杂的业务场景和用户需求。 