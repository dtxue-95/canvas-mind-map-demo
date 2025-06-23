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
  | { type: 'REPLACE_STATE', payload: { past: MindMapState[], present: MindMapState, future: MindMapState[] } };

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
}


// 节点编辑输入组件属性
export interface NodeEditInputProps {
  node: MindMapNode;                  // 要编辑的节点（从Node改为MindMapNode）
  viewport: Viewport;                    // 当前视口
  onSave: (text: string) => void;        // 保存回调
  onCancel: () => void;                  // 取消回调
  canvasBounds: DOMRect | null;          // 画布边界
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

