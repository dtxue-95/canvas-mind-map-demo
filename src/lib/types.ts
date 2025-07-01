import { IconType } from 'react-icons';
import React from 'react';
// import { MindMapState } from './hooks/useMindMap';

// 通用命令接口，所有命令的唯一 id 必须为短横线风格（如 add-child-node）
export interface Command {
  id: string; // 命令唯一标识符，必须与工具条 key 完全一致
  label: string; // 按钮显示文本
  title: string; // 按钮提示文本
  icon: IconType | ((state: MindMapState) => IconType); // 按钮图标，必须为 React 组件
  canExecute: (state: MindMapState, ...args: any[]) => boolean; // 是否可用判断
  execute: (state: MindMapState, ...args: any[]) => void; // 执行命令
  getDynamicProps?: (state: MindMapState) => Partial<Pick<Command, 'icon' | 'title' | 'label'>>; // 动态属性
}

// 基础几何类型
export interface Point {
  x: number;
  y: number;
}

// 优先级类型
export type NodePriority = 0 | 1 | 2 | 3; // 0-P0, 1-P1, 2-P2, 3-P3

export const PRIORITY_LABELS: { [k in NodePriority]: { label: string; color: string; bg: string } } = {
  0: { label: 'P0', color: '#ff3b30', bg: '#fff0ef' },
  1: { label: 'P1', color: '#ff9500', bg: '#fff7e6' },
  2: { label: 'P2', color: '#007aff', bg: '#e6f0ff' },
  3: { label: 'P3', color: '#8e8e93', bg: '#f4f4f7' },
};

// 思维导图节点AST（抽象语法树）结构
export interface MindMapNode {
  id: string;                    // 节点唯一标识符
  text: string;                  // 节点显示文本
  position: Point;               // 节点位置（由布局引擎设置）
  width: number;                 // 节点宽度（由布局引擎/calculateNodeDimensions设置）
  height: number;                // 节点高度（由布局引擎/calculateNodeDimensions设置）
  color: string;                 // 节点背景颜色
  textColor: string;             // 节点文本颜色
  children: MindMapNode[];    // 子节点数组（实际节点对象）
  isCollapsed: boolean;          // 是否折叠状态
  childrenCount?: number;        // 子节点数量（折叠时显示）
  style?: React.CSSProperties;   // 节点自定义样式（可选）
  nodeType?: string; // 节点类型
  priority?: NodePriority; // 节点优先级，0-P0，1-P1，2-P2，3-P3
}

// 视口状态
export interface Viewport {
  x: number;                     // 视口X坐标
  y: number;                     // 视口Y坐标
  zoom: number;                  // 缩放比例
}

/**
 * 工具条按钮配置
 *
 * 支持自定义按钮对象：
 * const customBtn: ToolbarButtonConfig = {
 *   id: 'custom-save',
 *   label: '保存',
 *   icon: FaSave,
 *   action: () => alert('保存！'),
 *   title: '保存当前思维导图'
 * };
 */
export interface ToolbarButtonConfig {
  id: string; // 按钮唯一标识符，必须与命令 id 一致
  label: string; // 按钮文本
  title?: string; // 按钮提示
  icon?: React.ComponentType<any> | IconType; // 按钮图标，React 组件
  action: () => void; // 按钮点击事件
  /**
   * 是否禁用。可为布尔值，或函数（根据当前思维导图状态动态判断）。
   * 例如：disabled: (state) => state.isReadOnly
   */
  disabled?: boolean | ((state: MindMapState) => boolean);
  visible?: boolean; // 是否可见，默认 true
}

// These are payload shapes
export interface AddNodePayload {
  text: string;
  parentId: string | null;
  nodeType?: string; // 新增，支持类型约束
}

export interface DeleteNodePayload {
  nodeId: string;
}

// These result types are no longer used by any reducer or command
/*
export interface AddNodeCommandResult {
  rootNode: MindMapNode | null;
  newNodeId: string;
}

export interface DeleteNodeCommandResult {
  rootNode: MindMapNode | null;
  newSelectedNodeId: string | null;
  deletedNodeIds: Set<string>;
}
*/

// 思维导图状态管理动作类型
export type MindMapAction =
  | { type: 'INIT_MAP' }
  | { type: 'ADD_NODE'; payload: AddNodePayload }
  | { type: 'DELETE_NODE'; payload: DeleteNodePayload }
  | { type: 'UPDATE_NODE_TEXT'; payload: { nodeId: string; text: string } }
  | { type: 'MOVE_NODE'; payload: { nodeId: string; position: Point } }
  | { type: 'SET_SELECTED_NODE'; payload: { nodeId: string | null } }
  | { type: 'SET_EDITING_NODE'; payload: { nodeId: string | null } }
  | { type: 'SET_VIEWPORT'; payload: Partial<Viewport> }
  | { type: 'LOAD_DATA'; payload: { rootNode: MindMapNode | null } }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'APPLY_LAYOUT_FROM_ROOT'; payload: { rootNode: MindMapNode } }
  | { type: 'SET_READ_ONLY'; payload: { isReadOnly: boolean } }
  | { type: 'TOGGLE_NODE_COLLAPSE'; payload: { nodeId: string } }
  | { type: 'GO_TO_NEXT_MATCH' }
  | { type: 'GO_TO_PREVIOUS_MATCH' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'REPLACE_STATE', payload: { past: MindMapState[], present: MindMapState, future: MindMapState[] } }
  | { type: 'SET_PRIORITY_CONFIG'; payload: { priorityConfig: MindMapPriorityConfig } }
  | { type: 'UPDATE_NODE_PRIORITY'; payload: { nodeId: string; priority: number } };

// This interface is now defined and exported from useMindMap.ts

export interface MindMapState {
  rootNode: MindMapNode | null;
  selectedNodeId: string | null;
  editingNodeId: string | null;
  viewport: Viewport;
  isReadOnly: boolean;
  currentSearchTerm: string;
  searchMatches: string[];
  highlightedNodeIds: Set<string>;
  currentMatchIndex: number;
  currentMatchNodeId: string | null;
  priorityConfig?: MindMapPriorityConfig;
}

// 操作类型枚举
export enum OperationType {
  ADD_NODE = 'ADD_NODE',
  DELETE_NODE = 'DELETE_NODE',
  UPDATE_NODE_TEXT = 'UPDATE_NODE_TEXT',
  TOGGLE_NODE_COLLAPSE = 'TOGGLE_NODE_COLLAPSE',
  UNDO = 'UNDO',
  REDO = 'REDO',
  LOAD_DATA = 'LOAD_DATA',
}

// 数据变更信息
export interface DataChangeInfo {
  operationType: OperationType;
  timestamp: number;
  // 操作相关的节点信息
  affectedNodeIds?: string[];
  // 新增的节点信息
  addedNodes?: MindMapNode[];
  // 删除的节点信息
  deletedNodes?: MindMapNode[];
  // 更新的节点信息
  updatedNodes?: MindMapNode[];
  // 操作前的完整数据（用于撤销/重做）
  previousData?: MindMapNode | null;
  // 操作后的完整数据
  currentData: MindMapNode | null;
  // 操作描述
  description: string;
  // 新增：当前操作节点的 id 链路（从根到当前节点）
  idChain?: string[];
  // 新增：当前节点父节点的 id 链路（从根到父节点）
  parentIdChain?: string[];
  // 新增：当前操作节点的详细信息
  currentNode?: MindMapNode;
  // 新增：当前节点的父节点详细信息
  parentNode?: MindMapNode;
  // 新增：当前操作节点的 id 链路对应的节点对象数组（从根到当前节点）
  idChainNodes?: MindMapNode[];
  // 新增：当前节点父节点的 id 链路对应的节点对象数组（从根到父节点）
  parentIdChainNodes?: MindMapNode[];
}

// 数据变更回调函数类型
export type DataChangeCallback = (changeInfo: DataChangeInfo) => void;

// 节点编辑输入组件属性
export interface NodeEditInputProps {
  node: MindMapNode;                  // 要编辑的节点（从Node改为MindMapNode）
  viewport: Viewport;                    // 当前视口
  onSave: (text: string) => void;        // 保存回调
  onCancel: () => void;                  // 取消回调
  canvasBounds: DOMRect | null;          // 画布边界
  typeConfig?: MindMapTypeConfig;        // 类型配置（用于标签渲染）
  setDynamicWidth?: (width: number) => void; // 新增：编辑时动态宽度回调
  priorityConfig?: MindMapPriorityConfig; // 新增：优先级标签配置
}

// 搜索组件属性
export interface SearchWidgetProps {
  isVisible: boolean;                    // 是否可见
  searchTerm: string;                    // 搜索词
  onSearchTermChange: (term: string) => void; // 搜索词变化回调
  onClose: () => void;                   // 关闭回调
  totalMatches: number;
  currentMatchIndex: number;
  onNextMatch: () => void;
  onPreviousMatch: () => void;
}

// 底部工具栏属性
export interface BottomToolbarProps {
  zoomPercentage: number;                // 缩放百分比
  isFullscreen: boolean;                 // 是否全屏
  isReadOnly: boolean;                   // 是否只读
  onZoomIn: () => void;                  // 放大回调
  onZoomOut: () => void;                 // 缩小回调
  onCenterView: () => void;              // 居中视图回调
  onFitView: () => void;                 // 适应视图回调
  onToggleFullscreen: () => void;        // 切换全屏回调
  onToggleSearchWidget: () => void;      // 切换搜索组件回调
  onToggleReadOnly: () => void;          // 切换只读模式回调
}

// 节点类型模式
export type NodeTypeMode = 'none' | 'builtin' | 'custom';

// 内置类型
export type BuiltinNodeType =
  | 'rootNode'
  | 'moduleNode'
  | 'testPointNode'
  | 'caseNode'
  | 'preconditionNode'
  | 'stepNode'
  | 'resultNode';

// 自定义类型配置
export interface CustomNodeTypeConfig {
  type: string; // 类型唯一标识
  label: string; // 标签显示文本
  color: string; // 标签颜色
  canAddTo: string[]; // 允许作为哪些类型的子节点
  canAddChildren: string[]; // 允许添加哪些类型的子节点
  maxChildrenOfType?: { [type: string]: number }; // 限制某类型子节点数量
}

// 类型控制配置
export interface MindMapTypeConfig {
  mode: NodeTypeMode;
  customTypes?: CustomNodeTypeConfig[];
}

export interface ReactMindMapProps {
  // ...原有props...
  /**
   * 获取节点自定义样式的回调。可用于动态设置每个节点的 style。
   * (node, state) => React.CSSProperties
   */
  getNodeStyle?: (node: MindMapNode, state: MindMapState) => React.CSSProperties;
  typeConfig?: MindMapTypeConfig;
  priorityConfig?: MindMapPriorityConfig; // 新增：优先级标签配置
}

// 内置节点类型约束配置
export const BUILTIN_NODE_TYPE_CONFIG = {
  rootNode: {
    canAddChildren: ['moduleNode'],
  },
  moduleNode: {
    canAddChildren: ['testPointNode'],
  },
  testPointNode: {
    canAddChildren: ['caseNode'],
  },
  caseNode: {
    canAddChildren: ['preconditionNode', 'stepNode'],
    maxChildrenOfType: {
      preconditionNode: 1,
      // stepNode: 无限制
    }
  },
  preconditionNode: {
    canAddChildren: [],
  },
  stepNode: {
    canAddChildren: ['resultNode'],
    maxChildrenOfType: {
      resultNode: 1,
    }
  },
  resultNode: {
    canAddChildren: [],
  }
};

// 优先级标签控制配置
export interface MindMapPriorityConfig {
  enabled: boolean;
  editable?: boolean; // 是否允许编辑优先级
  options?: Array<{ value: number; label: string; color?: string }>; // 优先级选项
  // ...其他配置
}

export interface PriorityConfig {
  enabled: boolean;
  editable?: boolean; // 是否允许编辑优先级
  options?: Array<{ value: number; label: string; color?: string }>; // 优先级选项
  // ...其他配置
}

