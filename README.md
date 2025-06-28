# 思维导图应用

这是一个基于React和Canvas的交互式思维导图应用，支持节点的创建、编辑、删除、拖拽、搜索等功能。

## 项目概述

这是一个基于 **React + TypeScript + Canvas** 构建的高性能思维导图应用，具有完整的交互功能和现代化的用户界面。项目采用组件化设计，支持高度定制化，提供了丰富的用户体验功能。

## 核心技术架构

### 技术栈
- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **渲染引擎**: HTML5 Canvas
- **状态管理**: React Hooks + useReducer
- **图标库**: React Icons
- **UI组件**: @alifd/next

### 核心组件结构

```
src/lib/
├── ReactMindMap.tsx          # 主组件入口
├── components/               # UI组件
│   ├── MindMapCanvas.tsx     # Canvas渲染核心
│   ├── Toolbar.tsx          # 顶部工具栏
│   ├── BottomViewportToolbar.tsx # 底部工具栏
│   ├── SearchWidget.tsx     # 搜索组件
│   ├── ContextMenu.tsx      # 右键菜单
│   ├── Minimap.tsx          # 缩略图
│   └── NodeEditInput.tsx    # 节点编辑输入
├── hooks/
│   └── useMindMap.ts        # 核心状态管理Hook
├── commands/                 # 命令模式实现
│   ├── addChildNodeCommand.ts
│   ├── addSiblingNodeCommand.ts
│   ├── deleteNodeCommand.ts
│   ├── undoCommand.ts
│   ├── redoCommand.ts
│   └── ...                  # 其他命令
├── utils/                    # 工具函数
│   ├── canvasUtils.ts       # Canvas绘制工具
│   └── nodeUtils.ts         # 节点操作工具
├── layoutEngine.ts          # 布局算法
├── types.ts                 # 类型定义
├── constants.ts             # 常量配置
└── defaultConfig.ts         # 默认配置
```

## 主要功能特性

### 🎯 节点管理
- ✅ 创建、编辑、删除节点
- ✅ 拖拽移动节点位置
- ✅ 节点折叠/展开
- ✅ 自定义节点样式
- ✅ 节点文本实时编辑

### 🔄 交互操作
- ✅ 鼠标拖拽平移画布
- ✅ 滚轮缩放
- ✅ 键盘快捷键支持
- ✅ 右键上下文菜单
- ✅ 触摸设备支持

### 🔍 搜索功能
- ✅ 实时搜索节点内容
- ✅ 精确匹配和模糊匹配
- ✅ 搜索结果高亮显示
- ✅ 自动定位到匹配节点
- ✅ 搜索结果导航

### 📱 视图控制
- ✅ 适应视图大小
- ✅ 居中视图
- ✅ 全屏模式
- ✅ 只读模式切换
- ✅ 缩略图导航

### 🎨 用户体验
- ✅ 响应式设计
- ✅ 现代化UI界面
- ✅ 撤销/重做功能
- ✅ 流畅的动画效果
- ✅ 良好的可访问性

## 核心设计模式

### 1. 命令模式 (Command Pattern)
```typescript
// 所有操作都通过命令模式实现
const commandRegistry: Map<string, Command> = new Map([
  [undoCommand.id, undoCommand],
  [redoCommand.id, redoCommand],
  [addChildNodeCommand.id, addChildNodeCommand],
  [deleteNodeCommand.id, deleteNodeCommand],
  // ... 更多命令
]);
```

### 2. 状态管理模式
```typescript
// 使用 useReducer 管理复杂状态
const [state, dispatch] = useReducer(mindMapReducer, initialState);

// 支持历史记录管理
const undoable = (reducer) => {
  // 实现撤销/重做功能
};
```

### 3. 布局算法
- 采用递归布局算法
- 支持动态节点尺寸计算
- 自动处理节点间距和对齐
- 优化分支高度计算

## 性能优化

### 1. Canvas渲染优化
- 使用设备像素比适配高分辨率屏幕
- 按需重绘，避免不必要的渲染
- 优化绘制函数，减少计算开销
- 支持背景图案绘制

### 2. 状态管理优化
- 深拷贝避免直接修改状态
- 历史记录管理支持撤销/重做
- 搜索状态缓存和优化
- 状态更新批处理

### 3. 事件处理优化
- 防抖处理滚轮事件
- 键盘事件冲突解决
- 被动事件监听器优化
- 焦点管理优化

## 项目特色

### 1. 高度可定制
- 支持自定义节点样式
- 可配置工具栏按钮
- 自定义右键菜单
- 灵活的配置选项
- 主题色彩定制

### 2. 完整的交互体验
- 丰富的快捷键支持
- 直观的拖拽操作
- 智能的搜索功能
- 流畅的动画效果
- 多设备兼容

### 3. 现代化设计
- 响应式布局
- 美观的UI设计
- 良好的可访问性
- 国际化支持
- 侧边栏工具栏设计

## 使用方式

### 基础使用
```typescript
import { ReactMindMap } from './lib';

const mindMapProps = {
  initialData: data,
  onDataChange: (newData) => setData(newData),
  showTopToolbar: true,
  showBottomToolbar: true,
  readOnly: false,
  getNodeStyle: (node) => ({ /* 自定义样式 */ }),
  canvasBackgroundColor: "#fffbe6",
  showDotBackground: true,
  showMinimap: true,
  enableContextMenu: true,
};

<ReactMindMap {...mindMapProps} />
```

### 高级配置 - 详细数据变更回调
```typescript
import { ReactMindMap, type DataChangeInfo, OperationType } from './lib';

// 处理详细的数据变更回调
const handleDataChangeDetailed = (changeInfo: DataChangeInfo) => {
  console.log('数据变更详情:', changeInfo);
  
  // 根据操作类型进行不同的处理
  switch (changeInfo.operationType) {
    case OperationType.ADD_NODE:
      console.log('新增节点:', changeInfo.addedNodes);
      // 可以获取新增的节点信息
      break;
    case OperationType.DELETE_NODE:
      console.log('删除节点:', changeInfo.deletedNodes);
      // 可以获取删除的节点信息
      break;
    case OperationType.UPDATE_NODE_TEXT:
      console.log('更新节点:', changeInfo.updatedNodes);
      // 可以获取更新的节点信息
      break;
    case OperationType.TOGGLE_NODE_COLLAPSE:
      console.log('切换折叠状态:', changeInfo.updatedNodes);
      break;
    case OperationType.UNDO:
      console.log('撤销操作');
      break;
    case OperationType.REDO:
      console.log('重做操作');
      break;
    case OperationType.LOAD_DATA:
      console.log('加载数据');
      break;
  }
  
  // 获取完整的当前数据
  console.log('当前完整数据:', changeInfo.currentData);
  
  // 获取操作前的数据（用于撤销/重做）
  console.log('操作前数据:', changeInfo.previousData);
  
  // 获取受影响的节点ID
  console.log('受影响的节点:', changeInfo.affectedNodeIds);
};

const mindMapProps = {
  initialData: data,
  onDataChange: (newData) => setData(newData), // 简单的数据变更回调
  onDataChangeDetailed: handleDataChangeDetailed, // 详细的数据变更回调
  // ... 其他配置
};

<ReactMindMap {...mindMapProps} />
```

### 数据变更信息结构
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
}
```

### 操作类型枚举
```typescript
enum OperationType {
  ADD_NODE = 'ADD_NODE',                    // 添加节点
  DELETE_NODE = 'DELETE_NODE',              // 删除节点
  UPDATE_NODE_TEXT = 'UPDATE_NODE_TEXT',    // 更新节点文本
  TOGGLE_NODE_COLLAPSE = 'TOGGLE_NODE_COLLAPSE', // 切换节点折叠状态
  UNDO = 'UNDO',                            // 撤销操作
  REDO = 'REDO',                            // 重做操作
  LOAD_DATA = 'LOAD_DATA',                  // 加载数据
}
```

## 快捷键

- `Tab`: 为选中节点添加子节点
- `Shift + Tab` 或 `Insert`: 添加兄弟节点
- `Delete` 或 `Backspace`: 删除选中节点
- `Enter`: 编辑节点文本
- `Esc`: 取消编辑
- `Ctrl + Z`: 撤销
- `Ctrl + Y`: 重做
- `Ctrl + F`: 打开搜索
- `F11`: 切换全屏

## 本地运行

**前置要求:** Node.js

1. 安装依赖:
   ```bash
   pnpm install
   ```

2. 运行应用:
   ```bash
   pnpm dev
   ```

3. 在浏览器中打开 `http://localhost:5173`

## 构建库文件

```bash
# 构建库文件
pnpm build:lib

# 预览构建结果
pnpm preview
```

## 项目优化亮点

### 1. 搜索功能优化
- ✅ 精确匹配和模糊匹配区分
- ✅ 搜索结果高亮显示
- ✅ 自动定位到匹配节点
- ✅ 搜索状态管理优化
- ✅ 键盘事件冲突解决

### 2. 渲染性能优化
- ✅ Canvas渲染优化
- ✅ 设备像素比适配
- ✅ 按需重绘机制
- ✅ 状态更新批处理

### 3. 用户体验优化
- ✅ 侧边栏工具栏设计
- ✅ 推出动画效果
- ✅ 响应式布局
- ✅ 多设备兼容

### 4. 代码质量优化
- ✅ TypeScript类型安全
- ✅ 组件化设计
- ✅ 命令模式架构
- ✅ 完整的错误处理

## 技术亮点

1. **Canvas渲染引擎**: 高性能的2D渲染，支持复杂图形绘制
2. **状态管理**: 基于useReducer的复杂状态管理，支持历史记录
3. **布局算法**: 智能的递归布局算法，自动处理节点位置
4. **命令模式**: 所有操作都通过命令模式实现，支持撤销/重做
5. **组件化设计**: 高度模块化的组件设计，易于扩展和维护
6. **性能优化**: 多层次的性能优化，确保流畅的用户体验

## 许可证

MIT License