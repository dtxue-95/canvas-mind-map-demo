import { IconType } from 'react-icons';
import React from 'react';

// 基础几何类型
export interface Point {
  x: number;
  y: number;
}

// 思维导图节点AST（抽象语法树）结构
export interface MindMapNodeAST {
  id: string;                    // 节点唯一标识符
  text: string;                  // 节点显示文本
  position: Point;               // 节点位置（由布局引擎设置）
  width: number;                 // 节点宽度（由布局引擎/calculateNodeDimensions设置）
  height: number;                // 节点高度（由布局引擎/calculateNodeDimensions设置）
  color: string;                 // 节点背景颜色
  textColor: string;             // 节点文本颜色
  children: MindMapNodeAST[];    // 子节点数组（实际节点对象）
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
 * Describes the configuration for a single button in a toolbar.
 */
export interface ToolbarButtonConfig {
  id: string;
  label: string;
  title?: string;
  icon?: React.ComponentType<any> | IconType;
  action: () => void;
  disabled?: boolean;
  visible?: boolean; // Default is true if not specified
}

// 添加节点命令参数
export interface AddNodeCommandArgs {
  text: string;                  // 新节点文本
  targetParentId?: string | null; // 目标父节点ID（AST中的父节点）
}

// 添加节点命令结果
export interface AddNodeCommandResult {
  rootNode: MindMapNodeAST | null; // 新的AST根节点
  newNodeId: string;             // 新创建的节点ID
}

// 删除节点命令参数
export interface DeleteNodeCommandArgs {
  nodeIdToDelete: string;        // 要删除的节点ID（从AST中删除）
}

// 删除节点命令结果
export interface DeleteNodeCommandResult {
  rootNode: MindMapNodeAST | null; // 新的AST根节点
  newSelectedNodeId: string | null; // 新的选中节点ID
  deletedNodeIds: Set<string>;   // 已删除的节点ID集合
}

// 思维导图状态管理动作类型
export type MindMapAction =
  | { type: 'INIT_MAP' }                                                                           // 初始化地图
  | { type: 'APPLY_ADD_NODE_RESULT'; payload: AddNodeCommandResult }                               // 应用添加节点结果
  | { type: 'APPLY_DELETE_NODE_RESULT'; payload: DeleteNodeCommandResult }                         // 应用删除节点结果
  | { type: 'UPDATE_NODE_TEXT'; payload: { nodeId: string; text: string } }                       // 更新节点文本
  | { type: 'MOVE_NODE'; payload: { nodeId: string; position: Point } }                           // 移动节点（世界坐标中的位置）
  | { type: 'SET_SELECTED_NODE'; payload: { nodeId: string | null } }                             // 设置选中节点
  | { type: 'SET_EDITING_NODE'; payload: { nodeId: string | null } }                              // 设置编辑节点
  | { type: 'SET_VIEWPORT'; payload: Partial<Viewport> }                                          // 设置视口
  | { type: 'LOAD_DATA'; payload: { rootNode: MindMapNodeAST | null } }                           // 加载数据作为AST
  | { type: 'SET_SEARCH_TERM'; payload: string }                                                  // 设置搜索词
  | { type: 'APPLY_LAYOUT_FROM_ROOT'; payload: { rootNode: MindMapNodeAST } }                        // 从根节点应用布局
  | { type: 'SET_READ_ONLY'; payload: { isReadOnly: boolean } }                                    // 设置只读模式
  | { type: 'TOGGLE_NODE_COLLAPSE'; payload: { nodeId: string } }                                // 切换节点折叠状态
  | { type: 'GO_TO_NEXT_MATCH' }                                                                // 导航到下一个搜索匹配项
  | { type: 'GO_TO_PREVIOUS_MATCH' };                                                           // 导航到上一个搜索匹配项

// 思维导图状态
export interface MindMapState {
  rootNode: MindMapNodeAST | null;        // AST的单一根节点
  selectedNodeId: string | null;          // 当前选中的节点ID
  editingNodeId: string | null;           // 当前编辑的节点ID
  viewport: Viewport;                     // 当前视口状态
  isReadOnly: boolean;                    // 是否为只读模式
  // 搜索相关状态
  currentSearchTerm: string;
  searchMatches: string[];          // 有序的匹配节点ID数组
  highlightedNodeIds: Set<string>;  // 所有匹配节点ID的集合，用于通用高亮
  currentMatchIndex: number;        // 当前在 searchMatches 数组中的索引
  currentMatchNodeId: string | null; // 当前导航到的节点ID，用于特殊高亮
}

// 节点编辑输入组件属性
export interface NodeEditInputProps {
  node: MindMapNodeAST;                  // 要编辑的节点（从Node改为MindMapNodeAST）
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