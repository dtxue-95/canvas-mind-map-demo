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
| `ADD_NODE` | 添加同级节点 | 新增的节点信息、受影响的节点ID |
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

## 2024-07-04 适应视图/居中视图命令首次点击无效的bug定位与修复

### 问题现象
- 拖动画布一切正常，但点击"适应视图（fitView）""居中视图（centerView）"等命令按钮时，首次点击无任何反应，控制台日志显示：
  - fitView return: no canvasSize
  - centerView return: no canvasSize
- 多次点击后偶尔生效，体验极差。

### 问题定位过程
1. **加入口日志**：在 fitView/centerView 命令入口处打印 presentState.rootNode、canvasSize 等 early return 条件。
2. **发现 canvasSize 为 null**：日志显示命令执行时 canvasSize 恒为 null，导致所有命令提前 return。
3. **分析 canvasSize 初始化流程**：canvasSize 由 ReactMindMap 组件 useEffect/resizeObserver 初始化，首次渲染时 canvasContainerRef 还未挂载，导致 setCanvasSize 没有被及时调用。
4. **确认根因**：首次渲染后 canvasSize 未初始化，命令按钮可点击但无效。

### 解决方案
- 在 ReactMindMap 组件 useEffect 中，首次渲染后用 setTimeout(updateSize, 0) 强制初始化 canvasSize，确保其不为 null。
- 这样所有依赖 canvasSize 的命令（fitView/centerView/zoomIn/zoomOut）首次点击即可生效。

### 相关代码片段
```js
useEffect(() => {
  const updateSize = () => {
    if (canvasContainerRef.current) {
      const { width, height } = canvasContainerRef.current.getBoundingClientRect();
      setCanvasSize({ width, height });
      setTopHandlePosition({ x: width - 32, y: height * 0.25 });
      setBottomHandlePosition({ x: width - 32, y: height * 0.75 });
    }
  };
  // 新增：首次渲染后强制初始化 canvasSize
  setTimeout(updateSize, 0);
  const resizeObserver = new ResizeObserver(updateSize);
  const target = appContainerRef.current;
  if (target) {
    resizeObserver.observe(target);
    updateSize();
  }
  return () => { if (target) resizeObserver.unobserve(target); };
}, []);
```

### 调试建议
- 若遇到命令按钮无效，优先检查 early return 条件（如 canvasSize/rootNode/selectedNodeId 是否为 null）。
- 在命令入口和 reducer、canvas 渲染等关键路径加详细日志，逐步缩小问题范围。
- 保证所有依赖 DOM 的初始化（如 canvasSize）在首次渲染后能被正确赋值。
- 命令按钮可根据 canvasSize 是否为 null 动态禁用，提升用户体验。

--- 

### 2024-07-02 编辑节点相关渲染与数据结构bug修复记录

#### 1. 编辑带子节点的节点时，子节点消失
- 问题现象：编辑带子节点的节点时，子节点全部消失。
- 原因分析：MindMapCanvas 渲染时，原本为避免重影，递归时遇到 editingId 直接 return，导致该节点及其所有子节点都被跳过渲染。
- 修复方案：只跳过当前节点的 drawNode，递归渲染其所有子节点，保证子树不丢失。

#### 2. 编辑带子节点的节点时，子节点连线不渲染
- 问题现象：编辑节点时，子节点本体能渲染，但与父节点的连线消失。
- 原因分析：连线绘制逻辑在父节点，原实现跳过了整个节点的所有绘制（包括连线），导致连线也被跳过。
- 修复方案：只跳过 drawNode，连线和折叠按钮始终绘制，保证结构完整。

#### 3. 编辑节点内容时，节点宽度变化但连线未跟随
- 问题现象：编辑节点内容时，节点宽度变化，但子节点连线起点未实时跟随输入框宽度。
- 原因分析：连线起点始终用 node.width，未感知输入框宽度变化。
- 修复方案：NodeEditInput 组件每次宽度变化时通过 setDynamicWidth 回调通知主画布，主画布渲染连线时若为 editingId 则用实时宽度，连线动态跟随输入框。

---

这些修复保证了编辑节点时：
- 子节点始终正常渲染
- 连线结构不丢失
- 连线与输入框宽度实时同步

并形成了"只跳过节点本体绘制，不跳过子树递归和连线"的最佳实践。

--- 

### 2024-07-02 内置类型节点同级节点添加约束重大更新

#### 1. 需求与规则
- 模块节点只能添加模块节点同级
- 测试点节点只能添加测试点节点同级
- 用例节点只能添加用例节点同级
- 步骤节点只能添加步骤节点同级
- 前置条件节点、预期结果节点不可添加同级
- 其他类型默认允许

#### 2. 实现方式
- 在 addSiblingNodeCommand 命令中，针对内置类型节点实现同级节点类型约束。
- 只有符合规则的类型才允许添加同级节点，否则按钮禁用或无效。
- 彻底防止了业务流程中节点类型混乱和非法结构。

#### 3. 影响与意义
- 保证了测试用例树结构的严谨性和一致性。
- 极大提升了用例设计的规范性和自动化处理能力。
- 形成了"内置类型节点同级/子级添加均有严格类型约束"的最佳实践。

--- 

## 2024-07-09 优先级菜单支持节点类型白名单与无优先级节点添加

- 新增：priorityConfig 增加 typeWhiteList 字段，可指定哪些 nodeType 支持优先级编辑/添加。
- 优化：
  1. 没有优先级的节点，右键菜单出现"添加优先级"二级菜单，选中即赋值。
  2. 有优先级的节点，右键菜单显示"修改优先级"二级菜单。
  3. 只有 typeWhiteList 指定类型的节点才显示优先级相关菜单，其他类型节点不显示。
- 技术实现：菜单生成逻辑统一判断节点类型和 priority 字段，动态切换"添加"或"修改"菜单项。
- 类型安全，兼容所有主流场景。

### 使用方法

```jsx
<ReactMindMap
  // ...其他props
  priorityConfig={{
    enabled: true,
    editable: true,
    options: [
      { value: 0, label: 'P0', color: '#ff3b30' },
      { value: 1, label: 'P1', color: '#ff9500' },
      { value: 2, label: 'P2', color: '#007aff' },
      { value: 3, label: 'P3', color: '#8e8e93' }
    ],
    typeWhiteList: ['caseNode', 'moduleNode'] // 只有这些类型节点才显示优先级菜单
  }}
/>
```

- 只需配置 typeWhiteList，即可灵活控制哪些节点类型支持优先级添加/编辑。
- 其它类型节点右键菜单不会出现优先级相关项。

--- 

## 2024-07-10 用例下前置条件节点始终排首优化 & 优先级菜单增强

- 优化：在"用例"节点下添加"前置条件"节点（preconditionNode）时，无论之前是否删除过，都会自动插入到 children[0]，保证前置条件始终排在用例下所有子节点的最前面。
- 其它类型节点仍然追加到末尾，结构更合理，符合业务预期。
- 相关 reducer 逻辑已在 useMindMap.ts 的 ADD_NODE case 内实现。

- 近期其它优化：
  - 优先级菜单支持 typeWhiteList，灵活控制哪些节点类型可添加/编辑优先级。
  - 没有优先级的节点右键菜单可直接"添加优先级"，有优先级的节点可"修改优先级"，菜单项自动区分。
  - 编辑态下标签缩放同步修复，保证缩放时字体、背景、边框一致。
  - Panel 组件支持六方位自定义内容，兼容 reactflow 风格。

### 业务效果
- 节点结构更智能，交互体验更统一，所有优化均已在 DATA_CHANGE_CALLBACK_FEATURE.md 留痕。

--- 

## 2024-07-10 优先级菜单点击展开与交互体验优化----

- 新增：点击"修改优先级"或"添加优先级"主菜单项时，也能展开/关闭优先级二级菜单，支持点击和悬停双方式触发。
- 优化：
  1. 优先级二级菜单宽度更窄（96px），主菜单宽度不变，视觉更紧凑。
  2. 一级、二级菜单项 hover 时均有背景色高亮，体验更佳。
  3. 鼠标离开一级菜单项和二级菜单时，二级菜单立即隐藏，一级菜单项高亮也消失。
  4. 修复二级菜单残留和高亮问题，右键弹出时状态重置。
  5. 快速滑动时，一级菜单项和二级菜单高亮、显示体验流畅。

- 技术实现：ContextMenu 组件内统一管理 submenuActive 状态，onClick/onMouseEnter/onMouseLeave 逻辑优化，保证点击和 hover 都能正常展开优先级菜单。

- 业务效果：优先级菜单交互体验与主流产品一致，支持"点击+悬停"双方式展开，视觉更美观，交互更流畅。

--- 

## 2024-07-10 初始渲染自动适应视图（fitView）优化

- 优化：思维导图初始渲染时，自动调用 fitView，保证导图内容始终居中、适应画布。
- 技术实现：在 MindMapCanvas 组件内监听 rootNode 初始化，首次渲染后自动触发 fitView，仅执行一次，不影响后续用户交互。
- 业务效果：用户打开页面即获得最佳视野，无需手动缩放或拖动画布。

--- 

## 【2024-07-02】搜索自动居中死循环问题修复

### 现象
- 在搜索框输入任意值后，控制台持续报错 `useMindMap.ts:445 Warning: Maximum update depth exceeded.`，页面卡死。
- 清空搜索框后恢复正常。

### 根因
- ReactMindMap.tsx 中"自动居中到当前搜索匹配节点"的 useEffect，每次 setViewport 都会导致 state 变化，进而再次触发自身，形成死循环。
- 只有搜索词非空、currentMatchNodeId 存在时才会触发。

### 修复方案
- 用 useRef 记录已居中节点 id，只在 currentMatchNodeId 变化时 setViewport，彻底断开 setState 死循环。

### 关键代码
```js
// ReactMindMap.tsx
const lastCenteredMatchId = useRef<string | null>(null);
useEffect(() => {
  if (
    state.currentMatchNodeId &&
    state.rootNode &&
    canvasSize &&
    lastCenteredMatchId.current !== state.currentMatchNodeId
  ) {
    const nodeToFocus = findNodeInAST(state.rootNode, state.currentMatchNodeId);
    if (nodeToFocus) {
      const nodeCenterWorld = { x: nodeToFocus.position.x + nodeToFocus.width / 2, y: nodeToFocus.position.y + nodeToFocus.height / 2 };
      const newX = (canvasSize.width / 2) - (nodeCenterWorld.x * state.viewport.zoom);
      const newY = (canvasSize.height / 2) - (nodeCenterWorld.y * state.viewport.zoom);
      mindMapHook.setViewport({ x: newX, y: newY });
      lastCenteredMatchId.current = state.currentMatchNodeId;
    }
  }
  if (!state.currentMatchNodeId) {
    lastCenteredMatchId.current = null;
  }
}, [state.currentMatchNodeId, state.rootNode, canvasSize, state.viewport.zoom, mindMapHook.setViewport]);
```

- 该修复已验证，彻底解决搜索自动居中导致的死循环问题。

--- 

## 【2024-07-02】搜索上下键全局可用问题修复越改越多

### 现象
- 搜索框失去焦点后，使用键盘上下键无法切换/查找下一个或上一个匹配节点。
- 只有搜索框有焦点时，键盘上下键才有效。

### 根因
- 上下键事件只在搜索输入框内监听，失去焦点后事件无法冒泡到全局，导致无法切换。
- 没有全局监听上下键事件。

### 修复方案
- 在 ReactMindMap.tsx 中全局监听上下键，搜索面板可见时响应，调用 goToNextMatch/goToPreviousMatch，无论焦点是否在输入框都能切换。

### 关键代码
```js
// ReactMindMap.tsx
useEffect(() => {
  if (!isSearchVisible) return;
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      goToNextMatch();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      goToPreviousMatch();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isSearchVisible, goToNextMatch, goToPreviousMatch]);
```

- 该修复已验证，彻底解决搜索框失焦后无法用键盘切换匹配节点的问题。

--- 

## 【2024-07-02~03】连线类型、箭头、虚线动画等功能优化与用法说明

### 1. 新增连线类型与箭头 API
- 支持通过全局 props 或节点 edgeConfig 灵活控制连线类型（lineType）和是否显示箭头（showArrow）。
- 支持的 lineType：
  - 'polyline'：直角折线（默认）
  - 'rounded'：带弧度的折线（仅折角处有圆角，水平/垂直线无弧度，弧度方向始终朝内）
  - 'bezier'：平滑贝塞尔曲线
  - 'dashed'：静态虚线折线
  - 'animated-dashed'：流动虚线（蚂蚁线动画）---目前还是有问题

### 2. 箭头优化
- 所有连线类型的箭头均为小灰色实心三角形，顶点正好指向目标节点，底边垂直于连线方向。
- 箭头方向始终与连线终点的切线方向一致，视觉自然。

### 3. rounded 类型优化
- 只有折角处有圆角，水平/垂直直线无弧度。
- 圆角方向始终朝内，视觉与主流思维导图一致。

### 4. 虚线与流动虚线
- 'dashed' 类型为静态虚线折线，样式与 polyline 一致但为虚线。
- 'animated-dashed' 类型为流动虚线，虚线段会自动动画流动（蚂蚁线效果），适合高亮路径等场景。
- animated-dashed 动画帧始终运行，canvas 每帧强制重绘，保证动画流畅。

### 5. 用法示例
```tsx
// 全局控制
<ReactMindMap lineType="rounded" showArrow={true} ... />
<ReactMindMap lineType="animated-dashed" showArrow={true} ... />

// 节点级控制（优先级高于全局）
{
  ...,
  edgeConfig: { type: 'bezier', showArrow: false }
}
{
  ...,
  edgeConfig: { type: 'animated-dashed', showArrow: true }
}
```

### 6. 相关问题与修复说明---

- rounded 早期实现为贝塞尔，现已修正为 arcTo 圆角折线，且只在折角处有圆角。
- 箭头早期为"V"型线段，现已统一为实心三角形，且方向始终正确。
- animated-dashed 早期动画不流动，现已修复为每帧强制重绘，动画效果流畅。
- 所有类型均支持全局/节点级灵活配置，兼容性与扩展性良好。

--- 

## 【2024-07-03】优先级变更监控与数据流修复

### 1. 优先级变更统一纳入全局数据流
- 修复了"添加/修改优先级"未能触发 onDataChangeDetailed 回调、控制台无打印的问题。
- 现在所有优先级变更均通过 updateNodePriority 方法实现，和增删节点、撤销重做等操作一样，能自动异步触发全局数据变更回调。
- 右键菜单二级项 onClick 已从 dispatch 替换为 updateNodePriority，彻底保证链路一致性。

### 2. reducer 及类型系统修正
- OperationType 枚举补充 UPDATE_NODE_PRIORITY，类型系统全链路识别。
- useMindMap.ts 内部 reducer 处理优先级变更时深拷贝节点树，返回新对象，确保 React 能检测到变化。
- 所有优先级变更均能被 handleDataChangeDetailed 监控和打印。

### 3. 右键菜单二级菜单体验优化
- 修复了二级菜单闪烁、消失等交互问题，主菜单与二级菜单之间可无缝切换。
- 优先级菜单项点击只弹出二级菜单，实际变更只在二级项点击时发生，避免误操作。

### 4. 其它相关修复
- pureNodeData 工具函数支持递归获取纯净业务数据，所有操作后可直接导出与初始数据结构一致的数据。
- 相关修复已在 handleDataChangeDetailed 回调中验证，所有节点结构和优先级变更均能统一监控。

--- 

## 全局消息提示（message）优化与用法说明

### 功能优化与问题修复
- 新增全局 message 单例对象，支持在任意组件/业务代码中通过 message.success/info/error/warning/custom 方式弹出全局消息，无需手动引入 MessageBox 组件。
- 支持多条消息队列，自动堆叠展示。
- 支持多种类型（info、success、error、warning、custom），每种类型有独立 icon 和主色。
- 消息背景色统一为白色，文字黑色，边框和 icon 匹配类型色，风格清爽。
- 支持每条消息自定义显示时长（duration，单位 ms，默认 3000），0 表示不自动消失。
- 只需在 App 入口挂载一次 <GlobalMessageBox />，其它地方无需关心状态和组件挂载。
- 彻底解决了 alert、手动状态管理等繁琐问题，极大提升开发效率和用户体验。

### 使用方法

1. **在 App 入口已自动挂载 <GlobalMessageBox />，无需重复挂载。**

2. **在任意组件直接导入 message 并调用：**

```js
import message from './lib/components/message';

// 简单用法
message.success('操作成功！');
message.error('出错了');
message.info('普通提示');
message.warning('警告信息');

// 支持自定义时长（单位 ms）
message.success({ content: '5秒后消失', duration: 5000 });

// 支持自定义类型
message.custom({ content: '自定义类型', duration: 4000 });
```

3. **API 说明**
- message.success/info/error/warning/custom(内容 | { content, duration })
- content：消息内容（必填）
- duration：显示时长，单位 ms，默认 3000，0 表示不自动消失

4. **效果说明**
- 多条消息自动堆叠，3 秒后自动消失（可自定义时长）
- icon、边框、主色随类型变化，背景始终为白色，文字黑色

---

如需扩展更多类型、支持关闭按钮、动画等，可在 message 及 MessageBox 组件基础上灵活扩展。

--- 

## 节点拖拽换父功能与优化说明

### 主要功能与实现
- 支持节点通过拖拽方式更换父节点，所有变更纳入全局数据流，支持撤销/重做。
- 拖拽逻辑采用"长按并拖拽超过阈值才脱离父节点"，有效防止误操作。
- 拖拽时，原节点及其所有子树（包括连线）会从画布上消失，仅显示拖拽预览和辅助线，父节点及兄弟节点正常显示。
- 拖拽预览为半透明虚线边框，辅助线为绿色虚线，终点精确指向目标节点右侧中点，符合实际连线方向。
- 拖拽判定支持左键和右键，松开鼠标时根据拖拽状态决定是否换父。

### 业务规则与约束
- 前置条件节点（preconditionNode）不能通过拖拽换父，只能在用例节点（caseNode）下新建。
- 用例节点下只能有一个前置条件节点，且始终在 children[0] 位置。
- 拖拽时如违反上述规则，自动通过全局 message 提示，操作被禁止。
- 其它内置类型节点拖拽时，严格校验目标节点类型、可挂载子类型、最大子节点数等业务约束。

### 视觉与交互优化
- 拖拽时辅助线、预览节点、目标节点高亮等视觉效果多次优化，保证用户能清楚看到拖拽目标和结构变化。
- 拖拽过程中，父节点、祖先节点、兄弟节点及其连线始终正常显示，只有被拖拽节点及其子树消失。
- 控制台添加详细调试日志，便于定位和排查拖拽相关问题。

### 只读/编辑模式下的行为一致性
- 只读模式下完全禁用节点拖拽，保持原有画布拖拽交互，鼠标光标和拖拽状态管理已修复。
- 编辑模式下，节点拖拽与画布拖拽互不干扰，体验流畅。

### 数据流与回调
- 所有拖拽换父操作均通过 onDataChangeDetailed 回调，外部可实时获取最新数据和链路信息。
- 变更信息包含 currentNode、parentNode、idChain、parentIdChain、idChainNodes、parentIdChainNodes，便于业务扩展和链路分析。

### 扩展性与最佳实践
- 拖拽换父逻辑高度解耦，支持自定义 canMoveNode 回调灵活扩展业务规则。
- 推荐所有外部只读/保存/导出场景均通过 onDataChangeDetailed 获取最新数据，避免直接操作内部状态。

### 拖拽换父 API 使用方法

1. **自定义拖拽规则**

可通过 ReactMindMap/MindMapCanvas 组件的 canMoveNode 属性自定义节点拖拽换父的业务规则：

```tsx
<ReactMindMap
  ...
  canMoveNode={(dragNode, targetParent) => {
    // 只允许 moduleNode 拖到 rootNode 下
    if (dragNode.nodeType === 'moduleNode' && targetParent.nodeType === 'rootNode') return true;
    // 禁止所有 preconditionNode 拖拽
    if (dragNode.nodeType === 'preconditionNode') return false;
    // 其它规则...
    return true;
  }}
/>
```

2. **监听拖拽变更**

所有拖拽换父操作均会触发 onDataChangeDetailed 回调，回调参数包含详细变更信息：

```tsx
<ReactMindMap
  ...
  onDataChangeDetailed={info => {
    // info.currentNode 拖拽后的节点对象
    // info.parentNode 新父节点对象
    // info.idChain/idChainNodes 节点链路
    // info.parentIdChain/parentIdChainNodes 父节点链路
    // info.operationType === 'MOVE_NODE'
    // 可用于自动保存、埋点、链路分析等
    console.log('拖拽换父变更', info);
  }}
/>
```

3. **典型用法**
- 拖拽时自动校验业务规则，违规时自动全局 message 提示，无需手动处理。
- 拖拽完成后可通过 onDataChangeDetailed 获取最新数据和链路，推荐用于自动保存、导出、埋点等场景。

--- 

## 2024-07-11 导出能力、辅助线与全局消息等近期优化

### 1. 专业导出能力全面上线
- 新增 ExportController 组件，支持一键导出思维导图为图片（PNG/JPEG）、SVG、PDF、Markdown、XMind、Txt、JSON、纯净数据等主流格式。
- 支持通过 API 控制显示哪些导出类型（visibleTypes），可灵活定制导出菜单。
- 所有导出均为专业格式，XMind 为标准 .xmind 文件，Markdown/Txt 为专业大纲格式。
- 支持通过 ref.open() 控制弹窗显示，getData/getCanvas/getSvg 提供导出内容。
- 典型用法：
```tsx
const exportRef = useRef<ExportControllerRef>(null);
<ExportController
  ref={exportRef}
  visibleTypes={['image', 'svg', 'pdf', 'markdown', 'xmind', 'txt', 'json', 'pure']}
  getData={getData}
  getCanvas={getCanvas}
  getSvg={getSvg}
/>
// 触发弹窗
exportRef.current?.open();
```
- 推荐在 App 或 ReactMindMap 外层挂载一份 ExportController，通过 ref 控制弹窗。

### 2. 辅助线与拖拽判定体验优化
- 拖拽节点时辅助线仅为细绿色虚线，无粗线和圆点，视觉更清爽。
- 辅助线始终连到目标节点右侧中点，吸附判定只要进入外围区域即可。
- 拖拽时父节点不再吸附，吸附判定自动排除父节点，避免误操作。
- 相关判定和绘制逻辑已在 MindMapCanvas 内部优化，体验与主流思维导图一致。
- 典型用法：无需额外配置，升级后自动生效。

### 3. 全局消息能力与右键菜单增强
- 新增全局 message 单例对象，支持 message.success/info/error/warning/custom 方式弹窗，无需手动挂载 MessageBox。
- 右键菜单支持二级菜单，优先级变更等操作已纳入全局数据流和回调。
- 典型用法：
```js
import message from './lib/components/message';
message.success('操作成功！');
message.error('出错了');
```

### 4. 其它典型用法与最佳实践
- 推荐所有外部只读/保存/导出场景均通过 onDataChangeDetailed 获取最新数据，避免直接操作内部状态。
- 导出按钮建议通过 topToolbarCustomButtons 传递给 ReactMindMap，action 直接调用 exportRef.current?.open()。
- 典型用法：
```tsx
const exportButton = {
  id: 'export',
  label: '导出',
  icon: FaDownload,
  action: () => exportRef.current?.open(),
};
<ReactMindMap topToolbarCustomButtons={[exportButton]} ... />
```

--- 
