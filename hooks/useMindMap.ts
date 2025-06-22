import React, { useReducer, useCallback, useEffect } from 'react';
import { MindMapNodeAST, Point, Viewport, MindMapState, MindMapAction, AddNodeCommandArgs, DeleteNodeCommandArgs } from '../types';
import { INITIAL_ZOOM, MIN_ZOOM, MAX_ZOOM, ZOOM_SENSITIVITY, CHILD_H_SPACING } from '../constants';
import { calculateNodeDimensions } from '../utils/canvasUtils';
import { createNode, countAllDescendants, deepCopyAST, findNodeInAST, findNodeAndParentInAST } from '../utils/nodeUtils';
import { applyLayout } from '../layoutEngine';
import { AddNodeCommand } from '../commands/addNodeCommand';
import { DeleteNodeCommand } from '../commands/deleteNodeCommand';
import { defaultInitialRootNodes } from '../initialData'; // 示例，如果我们想在这里加载它

// 初始状态
const initialState: MindMapState = {
  rootNode: null, // 从空数据开始
  selectedNodeId: null,
  editingNodeId: null,
  viewport: { x: 0, y: 0, zoom: INITIAL_ZOOM },
  currentSearchTerm: "",
  highlightedNodeIds: new Set<string>(),
  isReadOnly: false,
};

/**
 * 思维导图状态管理器
 * 处理所有状态更新逻辑
 */
function mindMapReducer(state: MindMapState, action: MindMapAction): MindMapState {
  switch (action.type) {
    case 'INIT_MAP': {
      // 初始化为真正的空状态。数据可以通过 LOAD_DATA 加载。
      return {
        ...initialState,
        viewport: { // 重置视口
          x: (state.viewport?.x !== undefined && state.viewport?.y !== undefined) ? state.viewport.x : (0 + CHILD_H_SPACING / 2), // 如果已经通过初始居中稍微平移，则保持当前
          y: (state.viewport?.x !== undefined && state.viewport?.y !== undefined) ? state.viewport.y : 0,
          zoom: INITIAL_ZOOM
        },
      };
    }
    case 'APPLY_ADD_NODE_RESULT': {
      return {
        ...state,
        rootNode: action.payload.rootNode,
        // selectedNodeId 和 editingNodeId 由 useMindMap 中的回调设置
      };
    }
    case 'APPLY_DELETE_NODE_RESULT': {
      const { rootNode, newSelectedNodeId, deletedNodeIds } = action.payload;
      return {
        ...state,
        rootNode,
        selectedNodeId: newSelectedNodeId,
        editingNodeId: state.editingNodeId && deletedNodeIds.has(state.editingNodeId) ? null : state.editingNodeId,
      };
    }
    case 'UPDATE_NODE_TEXT': {
      const { nodeId, text } = action.payload;
      const newRootNode = deepCopyAST(state.rootNode);
      const nodeToUpdate = findNodeInAST(newRootNode, nodeId);

      if (!nodeToUpdate) return state;

      nodeToUpdate.text = text;
      // 尺寸（宽度、高度）将由 applyLayout 重新计算

      const laidOutRoot = applyLayout(newRootNode);

      // 如有必要，更新高亮
      const searchTerm = state.currentSearchTerm.toLowerCase();
      let newHighlightedNodeIds = state.highlightedNodeIds;
      if (searchTerm) {
        newHighlightedNodeIds = new Set(state.highlightedNodeIds); // 克隆以进行修改
        if (text.toLowerCase().includes(searchTerm)) {
          newHighlightedNodeIds.add(nodeId);
        } else {
          newHighlightedNodeIds.delete(nodeId);
        }
      }
      return { ...state, rootNode: laidOutRoot, highlightedNodeIds: newHighlightedNodeIds };
    }
    case 'MOVE_NODE': {
      const { nodeId, position } = action.payload;
      const newRootNode = deepCopyAST(state.rootNode);
      const nodeToMove = findNodeInAST(newRootNode, nodeId);

      if (!nodeToMove) return state;

      nodeToMove.position = position;

      const laidOutRoot = applyLayout(newRootNode); // 重新布局整个树
      return { ...state, rootNode: laidOutRoot };
    }
    case 'SET_SELECTED_NODE':
      return { ...state, selectedNodeId: action.payload.nodeId, editingNodeId: null };
    case 'SET_EDITING_NODE':
      return { ...state, editingNodeId: action.payload.nodeId, selectedNodeId: action.payload.nodeId };
    case 'SET_VIEWPORT':
      return { ...state, viewport: { ...state.viewport, ...action.payload } };
    case 'LOAD_DATA': {
      const copiedRoot = deepCopyAST(action.payload.rootNode);
      const laidOutData = copiedRoot ? applyLayout(copiedRoot) : null;
      return {
        ...initialState, // 重置其他状态，如选择、编辑、搜索
        rootNode: laidOutData,
        selectedNodeId: laidOutData ? laidOutData.id : null,
        viewport: { // 加载新数据时重置视口
          x: (0 + CHILD_H_SPACING / 2),
          y: 0,
          zoom: INITIAL_ZOOM
        },
      };
    }
    case 'SET_SEARCH_TERM': {
      const searchTerm = action.payload.toLowerCase();
      const newHighlightedNodeIds = new Set<string>();

      function traverseAndHighlight(node: MindMapNodeAST | null) {
        if (!node) return;
        if (searchTerm && node.text.toLowerCase().includes(searchTerm)) {
          newHighlightedNodeIds.add(node.id);
        }
        if (!node.isCollapsed) { // 仅搜索可见的子节点
          node.children.forEach(traverseAndHighlight);
        }
      }
      traverseAndHighlight(state.rootNode);

      return { ...state, currentSearchTerm: action.payload, highlightedNodeIds: newHighlightedNodeIds };
    }
    case 'APPLY_LAYOUT_FROM_ROOT': {
      if (!state.rootNode) return state;
      const newRoot = applyLayout(deepCopyAST(state.rootNode));
      return { ...state, rootNode: newRoot };
    }
    case 'TOGGLE_READ_ONLY': {
      return { ...state, isReadOnly: !state.isReadOnly, editingNodeId: null }; // 模式更改时退出编辑
    }
    case 'TOGGLE_NODE_COLLAPSE': {
      const { nodeId } = action.payload;
      const newRootNode = deepCopyAST(state.rootNode);
      const nodeToToggle = findNodeInAST(newRootNode, nodeId);

      if (!nodeToToggle || !nodeToToggle.children || nodeToToggle.children.length === 0) return state;

      nodeToToggle.isCollapsed = !nodeToToggle.isCollapsed;
      if (nodeToToggle.isCollapsed) {
        nodeToToggle.childrenCount = countAllDescendants(nodeToToggle); // 计算原始节点的所有后代
      } else {
        // childrenCount 通常不显示在展开的节点上，或者可以是直接子节点计数
        nodeToToggle.childrenCount = 0;
      }

      const laidOutRoot = applyLayout(newRootNode);
      return { ...state, rootNode: laidOutRoot };
    }
    default:
      // @ts-expect-error - 穷举检查
      throw new Error(`未处理的动作类型: ${action.type}`);
  }
}

/**
 * 思维导图自定义Hook
 * 提供思维导图的所有状态管理和操作方法
 * @param canvasSize 画布尺寸（可选）
 * @returns 思维导图状态和操作方法
 */
export function useMindMap(canvasSize?: { width: number; height: number } | null) {
  const [state, dispatch] = useReducer(mindMapReducer, initialState);

  useEffect(() => {
    // 挂载时加载初始数据
    // LOAD_DATA action 会应用布局并选择根节点
    dispatch({ type: 'LOAD_DATA', payload: { rootNode: defaultInitialRootNodes[0] } });
  }, []); // 挂载时运行一次

  // 添加节点
  const addNode = useCallback((text: string, targetParentId?: string | null) => {
    if (state.isReadOnly) return;
    const args: AddNodeCommandArgs = { text, targetParentId };
    const result = AddNodeCommand.execute(state.rootNode, args);
    dispatch({ type: 'APPLY_ADD_NODE_RESULT', payload: result });
    dispatch({ type: 'SET_SELECTED_NODE', payload: { nodeId: result.newNodeId } });
    dispatch({ type: 'SET_EDITING_NODE', payload: { nodeId: result.newNodeId } });
  }, [state.isReadOnly, state.rootNode]);

  // 删除节点
  const deleteNode = useCallback((nodeIdToDelete: string) => {
    if (state.isReadOnly) return;
    const args: DeleteNodeCommandArgs = { nodeIdToDelete };
    const result = DeleteNodeCommand.execute(state.rootNode, args);
    dispatch({ type: 'APPLY_DELETE_NODE_RESULT', payload: result });
    dispatch({ type: 'SET_SELECTED_NODE', payload: { nodeId: result.newSelectedNodeId } });
    if (state.editingNodeId && result.deletedNodeIds.has(state.editingNodeId)) {
      dispatch({ type: 'SET_EDITING_NODE', payload: { nodeId: null } });
    }
  }, [state.isReadOnly, state.rootNode, state.editingNodeId]);

  // 更新节点文本
  const updateNodeText = useCallback((nodeId: string, text: string) => {
    if (state.isReadOnly) return;
    dispatch({ type: 'UPDATE_NODE_TEXT', payload: { nodeId, text } });
  }, [state.isReadOnly]);

  // 移动节点
  const moveNode = useCallback((nodeId: string, position: Point) => {
    if (state.isReadOnly) return;
    dispatch({ type: 'MOVE_NODE', payload: { nodeId, position } });
  }, [state.isReadOnly]);

  // 设置选中节点
  const setSelectedNode = useCallback((nodeId: string | null) => {
    dispatch({ type: 'SET_SELECTED_NODE', payload: { nodeId } });
  }, []);

  // 设置编辑节点
  const setEditingNode = useCallback((nodeId: string | null) => {
    if (state.isReadOnly && nodeId !== null) return;
    dispatch({ type: 'SET_EDITING_NODE', payload: { nodeId } });
  }, [state.isReadOnly]);

  // 设置视口
  const setViewport = useCallback((viewportUpdate: Partial<Viewport>) => {
    dispatch({ type: 'SET_VIEWPORT', payload: viewportUpdate });
  }, []);

  // 缩放操作
  const zoom = useCallback((delta: number, pivot: Point) => {
    const { x, y, zoom } = state.viewport;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom - delta * ZOOM_SENSITIVITY * zoom));

    const worldPivotX = (pivot.x - x) / zoom;
    const worldPivotY = (pivot.y - y) / zoom;

    const newX = pivot.x - worldPivotX * newZoom;
    const newY = pivot.y - worldPivotY * newZoom;

    setViewport({ x: newX, y: newY, zoom: newZoom });
  }, [state.viewport, setViewport]);

  // 平移操作
  const pan = useCallback((dx: number, dy: number) => {
    setViewport({ x: state.viewport.x + dx, y: state.viewport.y + dy });
  }, [state.viewport, setViewport]);

  // 设置搜索词
  const setSearchTerm = useCallback((term: string) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  }, []);

  // 切换只读模式
  const toggleReadOnlyMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_READ_ONLY' });
  }, []);

  // 切换节点折叠状态
  const toggleNodeCollapse = useCallback((nodeId: string) => {
    dispatch({ type: 'TOGGLE_NODE_COLLAPSE', payload: { nodeId } });
  }, []);

  return {
    state,
    dispatch, // 暴露 dispatch 用于 App.tsx 中的 LOAD_DATA 或 APPLY_LAYOUT_FROM_ROOT 等操作
    addNode,
    deleteNode,
    updateNodeText,
    moveNode,
    setSelectedNode,
    setEditingNode,
    setViewport,
    zoom,
    pan,
    setSearchTerm,
    toggleReadOnlyMode,
    toggleNodeCollapse,
  };
}