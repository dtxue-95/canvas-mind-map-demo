import { useReducer, useCallback, useEffect, useRef } from 'react';
import { MindMapNode, Point, Viewport, MindMapAction, AddNodePayload, DeleteNodePayload, MindMapState, DataChangeCallback, DataChangeInfo, OperationType, MindMapTypeConfig } from '../types';
import { INITIAL_ZOOM, MIN_ZOOM, MAX_ZOOM, ZOOM_SENSITIVITY, CHILD_H_SPACING, NODE_DEFAULT_COLOR, NODE_TEXT_COLOR } from '../constants';
import { countAllDescendants, deepCopyAST, findNodeAndParentInAST, findNodeInAST, transformToMindMapNode } from '../utils/nodeUtils';
import { applyLayout } from '../layoutEngine';
import { rawInitialData as defaultRawData } from '../initialData';


const initialMindMapState: MindMapState = {
  rootNode: null,
  selectedNodeId: null,
  editingNodeId: null,
  viewport: { x: 0, y: 0, zoom: INITIAL_ZOOM },
  isReadOnly: true,
  currentSearchTerm: '',
  searchMatches: [],
  highlightedNodeIds: new Set<string>(),
  currentMatchIndex: -1,
  currentMatchNodeId: null,
};

function createMindMapReducer(typeConfig?: any) {
  return function mindMapReducer(state: MindMapState = initialMindMapState, action: MindMapAction): MindMapState {
    switch (action.type) {
      case 'REPLACE_STATE': // Special action to replace the whole state for history reset
        console.log('REPLACE_STATE'); console.trace('REPLACE_STATE');
        return (action as any).payload.present; // Return the present part of the payload
      case 'INIT_MAP':
        return state;
      case 'ADD_NODE': {
        if (!state.rootNode) return state; // Or handle creating a root node
        const { text, parentId, nodeType } = (action as any).payload;
        const newRoot = deepCopyAST(state.rootNode);
        const parent = parentId ? findNodeInAST(newRoot, parentId) : newRoot;
        if (!parent) {
          console.error("ADD_NODE: Parent node not found!");
          return state;
        }
        const newNode: MindMapNode = {
          id: `node-${Date.now()}-${Math.random()}`,
          text: text,
          children: [],
          position: { x: 0, y: 0 }, // Position will be set by layout
          width: 0, height: 0, // Dimensions will be set by layout
          color: NODE_DEFAULT_COLOR,
          textColor: NODE_TEXT_COLOR,
          isCollapsed: false,
          ...(nodeType ? { nodeType } : {}),
        };
        parent.children.push(newNode);
        const laidOutRoot = applyLayout(newRoot, typeConfig);
        return { ...state, rootNode: laidOutRoot, selectedNodeId: newNode.id };
      }
      case 'DELETE_NODE': {
        if (!state.rootNode) return state;
        const { nodeId } = (action as { type: 'DELETE_NODE', payload: DeleteNodePayload }).payload;

        if (state.rootNode.id === nodeId) {
          console.error("DELETE_NODE: Cannot delete the root node.");
          return state;
        }

        const newRoot = deepCopyAST(state.rootNode);
        const result = findNodeAndParentInAST(newRoot, nodeId);

        if (!result || !result.parent) {
          console.error("DELETE_NODE: Node or its parent not found.");
          return state;
        }

        const { parent, node: nodeToDelete } = result;
        const index = parent.children.findIndex(child => child.id === nodeId);

        if (index === -1) return state;

        const deletedNodeIds = new Set<string>();
        function collectIds(node: MindMapNode) {
          deletedNodeIds.add(node.id);
          node.children.forEach(collectIds);
        }
        collectIds(nodeToDelete);

        parent.children.splice(index, 1);

        let newSelectedNodeId: string | null = parent.id;

        const laidOutRoot = applyLayout(newRoot, typeConfig);

        return {
          ...state,
          rootNode: laidOutRoot,
          selectedNodeId: newSelectedNodeId,
          editingNodeId: state.editingNodeId && deletedNodeIds.has(state.editingNodeId) ? null : state.editingNodeId
        };
      }
      case 'LOAD_DATA': {
        const copiedRoot = deepCopyAST(action.payload.rootNode);
        if (copiedRoot) {
          // 遍历树，为初始就折叠的节点计算 childrenCount
          function traverseAndCount(node: MindMapNode) {
            if (node.isCollapsed && node.children && node.children.length > 0) {
              node.childrenCount = countAllDescendants(node);
            }
            node.children.forEach(traverseAndCount);
          }
          traverseAndCount(copiedRoot);
        }
        const laidOutData = copiedRoot ? applyLayout(copiedRoot, typeConfig) : null;
        return { ...state, rootNode: laidOutData, selectedNodeId: laidOutData ? laidOutData.id : null, viewport: { x: (0 + CHILD_H_SPACING / 2), y: 0, zoom: INITIAL_ZOOM } };
      }
      case 'UPDATE_NODE_TEXT': {
        const { nodeId, text } = action.payload;
        const newRootNode = deepCopyAST(state.rootNode);
        const nodeToUpdate = findNodeInAST(newRootNode, nodeId);
        if (nodeToUpdate) {
          nodeToUpdate.text = text;
          if (!Array.isArray(nodeToUpdate.children)) {
            throw new Error('节点 children 丢失！请检查数据流。');
          }
        }
        // After updating text, we MUST re-layout to get new dimensions
        const laidOutRoot = newRootNode ? applyLayout(newRootNode, typeConfig) : null;
        return { ...state, rootNode: laidOutRoot };
      }
      case 'SET_SELECTED_NODE': return { ...state, selectedNodeId: action.payload.nodeId, editingNodeId: null };
      case 'SET_EDITING_NODE': return { ...state, editingNodeId: action.payload.nodeId, selectedNodeId: action.payload.nodeId };
      case 'SET_VIEWPORT':
        console.log('REDUCER SET_VIEWPORT', action.payload, 'prev', state.viewport);
        return { ...state, viewport: { ...state.viewport, ...action.payload } };
      case 'SET_READ_ONLY': {
        const newIsReadOnly = action.payload.isReadOnly;
        if (state.isReadOnly === newIsReadOnly) {
          return state;
        }
        return { ...state, isReadOnly: newIsReadOnly, editingNodeId: newIsReadOnly ? null : state.editingNodeId };
      }
      case 'TOGGLE_NODE_COLLAPSE': {
        const { nodeId } = action.payload;
        const newRootNode = deepCopyAST(state.rootNode);
        const nodeToToggle = findNodeInAST(newRootNode, nodeId);
        if (!nodeToToggle || !nodeToToggle.children || nodeToToggle.children.length === 0) return state;
        nodeToToggle.isCollapsed = !nodeToToggle.isCollapsed;
        if (nodeToToggle.isCollapsed) nodeToToggle.childrenCount = countAllDescendants(nodeToToggle); else nodeToToggle.childrenCount = 0;
        const laidOutRoot = applyLayout(newRootNode, typeConfig);
        return { ...state, rootNode: laidOutRoot };
      }
      case 'SET_SEARCH_TERM': {
        const searchTerm = action.payload.toLowerCase().trim();
        if (!searchTerm) {
          return { ...state, currentSearchTerm: '', highlightedNodeIds: new Set(), searchMatches: [], currentMatchIndex: -1, currentMatchNodeId: null };
        }
        const newMatches: string[] = [];
        const newHighlightedNodeIds = new Set<string>();
        function traverseAndSearch(node: MindMapNode | null) {
          if (!node) return;
          if (node.text.toLowerCase().includes(searchTerm)) {
            newMatches.push(node.id);
            newHighlightedNodeIds.add(node.id);
          }
          node.children.forEach(traverseAndSearch);
        }
        traverseAndSearch(state.rootNode);

        const newIndex = newMatches.length > 0 ? 0 : -1;
        const newCurrentMatchId = newIndex !== -1 ? newMatches[newIndex] : null;

        return { ...state, currentSearchTerm: action.payload, searchMatches: newMatches, highlightedNodeIds: newHighlightedNodeIds, currentMatchIndex: newIndex, currentMatchNodeId: newCurrentMatchId };
      }
      case 'GO_TO_NEXT_MATCH': {
        if (state.searchMatches.length === 0) return state;
        const newIndex = (state.currentMatchIndex + 1) % state.searchMatches.length;
        return { ...state, currentMatchIndex: newIndex, currentMatchNodeId: state.searchMatches[newIndex] };
      }
      case 'GO_TO_PREVIOUS_MATCH': {
        if (state.searchMatches.length === 0) return state;
        const newIndex = (state.currentMatchIndex - 1 + state.searchMatches.length) % state.searchMatches.length;
        return { ...state, currentMatchIndex: newIndex, currentMatchNodeId: state.searchMatches[newIndex] };
      }
      default: return state;
    }
  }
}

interface HistoryState {
  past: MindMapState[];
  present: MindMapState;
  future: MindMapState[];
}

// Renamed the original initial state to avoid confusion
const initialHistoryState: HistoryState = {
  past: [],
  present: initialMindMapState,
  future: [],
};

type ReducerFn = (state: MindMapState, action: MindMapAction) => MindMapState;
const undoable = (reducer: ReducerFn) => {
  // The new initial state for our history-aware reducer
  const initialHistoryState: HistoryState = {
    past: [],
    present: reducer(initialMindMapState, { type: 'INIT_MAP' }),
    future: [],
  };

  // 新增：全局 isReadOnly 状态
  let globalIsReadOnly = initialMindMapState.isReadOnly;

  // 新增：全局初始 rootNode 数据
  let globalInitialRootNode: MindMapNode | null = null;

  return (state: HistoryState = initialHistoryState, action: MindMapAction | { type: 'UNDO' } | { type: 'REDO' }): HistoryState => {
    const { past, present, future } = state;

    // 只读切换时，更新全局 isReadOnly
    if (action.type === 'SET_READ_ONLY') {
      globalIsReadOnly = (action as any).payload.isReadOnly;
    }
    // 记录初始 rootNode
    if (action.type === 'LOAD_DATA' && action.payload && action.payload.rootNode) {
      globalInitialRootNode = deepCopyAST(action.payload.rootNode);
    }

    function ensureRootNode(state: MindMapState): MindMapState {
      if (!state.rootNode && globalInitialRootNode) {
        return { ...state, rootNode: deepCopyAST(globalInitialRootNode), selectedNodeId: globalInitialRootNode.id };
      }
      return state;
    }

    switch (action.type) {
      case 'UNDO': {
        if (past.length === 0) return state;
        let previous = { ...past[past.length - 1], isReadOnly: globalIsReadOnly };
        previous = ensureRootNode(previous);
        const newPast = past.slice(0, past.length - 1);
        return {
          past: newPast,
          present: previous,
          future: [{ ...present, isReadOnly: globalIsReadOnly }, ...future],
        };
      }
      case 'REDO': {
        if (future.length === 0) return state;
        let next = { ...future[0], isReadOnly: globalIsReadOnly };
        next = ensureRootNode(next);
        const newFuture = future.slice(1);
        return {
          past: [...past, { ...present, isReadOnly: globalIsReadOnly }],
          present: next,
          future: newFuture,
        };
      }
      default: {
        // These actions should not be part of the undo history
        const nonUndoableActions = new Set([
          'SET_SELECTED_NODE', 'SET_EDITING_NODE', 'SET_VIEWPORT', 'SET_READ_ONLY',
          'SET_SEARCH_TERM', 'GO_TO_NEXT_MATCH', 'GO_TO_PREVIOUS_MATCH'
        ]);

        const newPresent = reducer(present, action as MindMapAction);
        // 始终保持 isReadOnly 为全局状态
        newPresent.isReadOnly = globalIsReadOnly;
        // 任何历史快照都不允许 rootNode 为空
        const safePresent = ensureRootNode(newPresent);

        if (present === safePresent) {
          return state;
        }

        if (nonUndoableActions.has(action.type)) {
          return { past, present: safePresent, future };
        }

        // For undoable actions, clear the future
        return {
          past: [...past, { ...present, isReadOnly: globalIsReadOnly }],
          present: safePresent,
          future: [],
        };
      }
    }
  };
};


const mindMapReducer = createMindMapReducer();
const historyReducer = undoable(mindMapReducer);

export function useMindMap(
  canvasSize?: { width: number; height: number } | null,
  initialDataProp?: any,
  onDataChangeDetailed?: DataChangeCallback,
  onDataChange?: (data: MindMapNode) => void,
  typeConfig?: MindMapTypeConfig,
) {
  const [state, dispatch] = useReducer(historyReducer, undefined, () => historyReducer(initialHistoryState, { type: 'INIT_MAP' }));

  // 创建数据变更信息的辅助函数
  const createDataChangeInfo = useCallback((
    operationType: OperationType,
    currentData: MindMapNode | null,
    previousData?: MindMapNode | null,
    affectedNodeIds?: string[],
    addedNodes?: MindMapNode[],
    deletedNodes?: MindMapNode[],
    updatedNodes?: MindMapNode[],
    description?: string
  ): DataChangeInfo => {
    return {
      operationType,
      timestamp: Date.now(),
      affectedNodeIds,
      addedNodes,
      deletedNodes,
      updatedNodes,
      previousData,
      currentData,
      description: description || `执行了${operationType}操作`,
    };
  }, []);

  // 触发数据变更回调的辅助函数
  const triggerDataChangeCallback = useCallback((changeInfo: DataChangeInfo) => {
    if (onDataChangeDetailed) {
      onDataChangeDetailed(changeInfo);
    }
  }, [onDataChangeDetailed]);

  // 只在首次挂载时初始化，防御多次触发
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    const dataToLoad = initialDataProp || defaultRawData;
    const formattedData = transformToMindMapNode(dataToLoad);
    // LOAD_DATA should reset the history
    const initialAction = { type: 'LOAD_DATA', payload: { rootNode: formattedData } };
    const newState = mindMapReducer(initialMindMapState, initialAction as any);
    dispatch({
      type: 'REPLACE_STATE',
      payload: { past: [], present: newState, future: [] }
    } as any);

    // 触发初始数据加载的回调
    if (onDataChangeDetailed) {
      const changeInfo = createDataChangeInfo(
        OperationType.LOAD_DATA,
        formattedData,
        null,
        undefined,
        undefined,
        undefined,
        undefined,
        '初始化思维导图数据'
      );
      triggerDataChangeCallback(changeInfo);
    }
  }, []); // 依赖数组只留空，确保只初始化一次

  const { state: presentState, dispatch: historyDispatch } = { state: state.present, dispatch };

  const updateNodeText = useCallback((nodeId: string, text: string) => {
    const previousData = deepCopyAST(presentState.rootNode);
    const nodeToUpdate = previousData ? findNodeInAST(previousData, nodeId) : null;
    historyDispatch({ type: 'UPDATE_NODE_TEXT', payload: { nodeId, text } });
    setTimeout(() => {
      const updatedState = historyReducer(state, { type: 'UPDATE_NODE_TEXT', payload: { nodeId, text } });
      const currentData = updatedState.present.rootNode;
      const updatedNode = currentData ? findNodeInAST(currentData, nodeId) : undefined;
      let parentResult: { node: MindMapNode; parent: MindMapNode | null } | null = null;
      if (currentData) {
        parentResult = findNodeAndParentInAST(currentData, nodeId);
      }
      const idChain = nodeId ? (findIdChain(currentData, nodeId) || undefined) : undefined;
      const parentIdChain = parentResult?.parent ? (findIdChain(currentData, parentResult.parent.id) || undefined) : undefined;
      const currentNode = updatedNode || undefined;
      const parentNode = parentResult?.parent || undefined;
      const idChainNodes = findNodeChain(currentData, idChain);
      const parentIdChainNodes = findNodeChain(currentData, parentIdChain);
      const changeInfo = {
        ...createDataChangeInfo(
          OperationType.UPDATE_NODE_TEXT,
          currentData,
          previousData,
          [nodeId],
          undefined,
          undefined,
          updatedNode ? [updatedNode] : undefined,
          `更新节点文本: ${nodeToUpdate?.text || nodeId} -> ${text}`
        ),
        idChain,
        parentIdChain,
        currentNode,
        parentNode,
        idChainNodes,
        parentIdChainNodes,
      };
      triggerDataChangeCallback(changeInfo);
      if (onDataChange && currentData) onDataChange(currentData);
    }, 0);
  }, [presentState.rootNode, historyDispatch, state, createDataChangeInfo, triggerDataChangeCallback, onDataChange]);

  const setViewport = useCallback((viewportUpdate: Partial<Viewport>) => {
    console.log('setViewport', viewportUpdate, 'before', state.present.viewport);
    historyDispatch({ type: 'SET_VIEWPORT', payload: viewportUpdate });
    setTimeout(() => {
      console.log('setViewport', 'after', state.present.viewport);
    }, 0);
  }, [state.present.viewport]);

  const addNode = useCallback((text: string, parentId: string | null = null, nodeType?: string) => {
    // 保存操作前的状态
    const previousData = deepCopyAST(presentState.rootNode);

    // 执行添加节点操作，支持 nodeType
    historyDispatch({ type: 'ADD_NODE', payload: { text, parentId, nodeType } });

    // 在下一个事件循环中获取更新后的状态并触发回调
    setTimeout(() => {
      // 获取更新后的状态
      const updatedState = historyReducer(state, { type: 'ADD_NODE', payload: { text, parentId, nodeType } });
      const currentData = updatedState.present.rootNode;

      // 查找新添加的节点的辅助函数
      const findNewNode = (node: MindMapNode): MindMapNode | null => {
        if (node.text === text) {
          if (parentId === null) {
            if (node === currentData) return node;
          } else {
            const parentResult = findNodeAndParentInAST(currentData, node.id);
            if (parentResult && parentResult.parent && parentResult.parent.id === parentId) {
              return node;
            }
          }
        }
        for (const child of node.children) {
          const found = findNewNode(child);
          if (found) return found;
        }
        return null;
      };

      const newNode = currentData ? findNewNode(currentData) : null;
      let parentResult: { node: MindMapNode; parent: MindMapNode | null } | null = null;
      if (newNode && currentData) {
        parentResult = findNodeAndParentInAST(currentData, newNode.id);
      }
      const idChain = newNode ? (findIdChain(currentData, newNode.id) || undefined) : undefined;
      const parentIdChain = newNode && parentResult?.parent ? (findIdChain(currentData, parentResult.parent.id) || undefined) : undefined;
      const currentNode = newNode || undefined;
      const parentNode = parentResult?.parent || undefined;

      const idChainNodes = findNodeChain(currentData, idChain);
      const parentIdChainNodes = findNodeChain(currentData, parentIdChain);
      const changeInfo = {
        ...createDataChangeInfo(
          OperationType.ADD_NODE,
          currentData,
          previousData,
          newNode ? [newNode.id] : undefined,
          newNode ? [newNode] : undefined,
          undefined,
          undefined,
          `添加同级节点: ${text}`
        ),
        idChain,
        parentIdChain,
        currentNode,
        parentNode,
        idChainNodes,
        parentIdChainNodes,
      };

      triggerDataChangeCallback(changeInfo);
      if (onDataChange && currentData) onDataChange(currentData);
    }, 0);
  }, [presentState.rootNode, historyDispatch, state, createDataChangeInfo, triggerDataChangeCallback, onDataChange]);

  const deleteNode = useCallback((nodeId: string) => {
    const previousData = deepCopyAST(presentState.rootNode);
    const nodeToDelete = previousData ? findNodeInAST(previousData, nodeId) : null;
    historyDispatch({ type: 'DELETE_NODE', payload: { nodeId } });
    setTimeout(() => {
      const updatedState = historyReducer(state, { type: 'DELETE_NODE', payload: { nodeId } });
      const currentData = updatedState.present.rootNode;
      let parentResult: { node: MindMapNode; parent: MindMapNode | null } | null = null;
      if (currentData) {
        parentResult = findNodeAndParentInAST(currentData, nodeId);
      }
      const idChain = nodeId ? (findIdChain(currentData, nodeId) || undefined) : undefined;
      const parentIdChain = parentResult?.parent ? (findIdChain(currentData, parentResult.parent.id) || undefined) : undefined;
      const currentNode = nodeToDelete || undefined;
      const parentNode = parentResult?.parent || undefined;
      const idChainNodes = findNodeChain(currentData, idChain);
      const parentIdChainNodes = findNodeChain(currentData, parentIdChain);
      const changeInfo = {
        ...createDataChangeInfo(
          OperationType.DELETE_NODE,
          currentData,
          previousData,
          [nodeId],
          undefined,
          nodeToDelete ? [nodeToDelete] : undefined,
          undefined,
          `删除节点: ${nodeToDelete?.text || nodeId}`
        ),
        idChain,
        parentIdChain,
        currentNode,
        parentNode,
        idChainNodes,
        parentIdChainNodes,
      };
      triggerDataChangeCallback(changeInfo);
      if (onDataChange && currentData) onDataChange(currentData);
    }, 0);
  }, [presentState.rootNode, historyDispatch, state, createDataChangeInfo, triggerDataChangeCallback, onDataChange]);

  const setSelectedNode = useCallback((nodeId: string | null) => historyDispatch({ type: 'SET_SELECTED_NODE', payload: { nodeId } }), []);
  const setEditingNode = useCallback((nodeId: string | null) => { if (!presentState.isReadOnly || nodeId === null) historyDispatch({ type: 'SET_EDITING_NODE', payload: { nodeId } }); }, [presentState.isReadOnly]);
  const pan = useCallback((dx: number, dy: number) => {
    console.log('pan', dx, dy, presentState.viewport);
    setViewport({ x: presentState.viewport.x + dx, y: presentState.viewport.y + dy });
  }, [presentState.viewport, setViewport]);

  const zoom = useCallback((delta: number, mousePosition: Point) => {
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, presentState.viewport.zoom * (1 - delta * ZOOM_SENSITIVITY)));
    const worldPos = { x: (mousePosition.x - presentState.viewport.x) / presentState.viewport.zoom, y: (mousePosition.y - presentState.viewport.y) / presentState.viewport.zoom };
    const newViewportX = mousePosition.x - worldPos.x * newZoom;
    const newViewportY = mousePosition.y - worldPos.y * newZoom;
    setViewport({ x: newViewportX, y: newViewportY, zoom: newZoom });
  }, [presentState.viewport, setViewport]);

  const zoomWithRatio = useCallback((ratio: number) => {
    if (!canvasSize) return;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, presentState.viewport.zoom * ratio));
    const screenCenter = { x: canvasSize.width / 2, y: canvasSize.height / 2 };
    const worldPos = { x: (screenCenter.x - presentState.viewport.x) / presentState.viewport.zoom, y: (screenCenter.y - presentState.viewport.y) / presentState.viewport.zoom };
    const newViewportX = screenCenter.x - worldPos.x * newZoom;
    const newViewportY = screenCenter.y - worldPos.y * newZoom;
    setViewport({ x: newViewportX, y: newViewportY, zoom: newZoom });
  }, [canvasSize, presentState.viewport, setViewport]);

  const zoomIn = useCallback(() => zoomWithRatio(1.2), [zoomWithRatio]);
  const zoomOut = useCallback(() => zoomWithRatio(1 / 1.2), [zoomWithRatio]);

  const fitView = useCallback((centerOnly = false) => {
    console.log('fitView', centerOnly, presentState.rootNode, canvasSize);
    if (!presentState.rootNode) { console.log('fitView return: no rootNode'); return; }
    if (!canvasSize) { console.log('fitView return: no canvasSize'); return; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    function getBoundsRecursive(node: MindMapNode) {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + node.width);
      maxY = Math.max(maxY, node.position.y + node.height);
      if (!node.isCollapsed) node.children.forEach(getBoundsRecursive);
    }
    getBoundsRecursive(presentState.rootNode);
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    if (contentWidth <= 0 || contentHeight <= 0) { console.log('fitView return: invalid content size'); return; }
    const padding = 50;
    const newZoom = centerOnly ? presentState.viewport.zoom : Math.min((canvasSize.width - padding * 2) / contentWidth, (canvasSize.height - padding * 2) / contentHeight, MAX_ZOOM);
    const newX = (canvasSize.width / 2) - ((minX + contentWidth / 2) * newZoom);
    const newY = (canvasSize.height / 2) - ((minY + contentHeight / 2) * newZoom);
    console.log('fitView computed', { newX, newY, newZoom });
    setViewport({ x: newX, y: newY, zoom: newZoom });
  }, [presentState.rootNode, canvasSize, presentState.viewport.zoom, setViewport]);

  const centerView = useCallback(() => {
    console.log('centerView', state.present.selectedNodeId, state.present.rootNode, canvasSize);
    if (!canvasSize) { console.log('centerView return: no canvasSize'); return; }
    if (!state.present.rootNode) { console.log('centerView return: no rootNode'); return; }
    const nodeToCenterId = state.present.selectedNodeId || state.present.rootNode.id;
    const node = findNodeInAST(state.present.rootNode, nodeToCenterId);
    if (!node) { console.log('centerView return: no node to center'); return; }
    const nodeCenter = { x: node.position.x + node.width / 2, y: node.position.y + node.height / 2 };
    const newX = canvasSize.width / 2 - nodeCenter.x * state.present.viewport.zoom;
    const newY = canvasSize.height / 2 - nodeCenter.y * state.present.viewport.zoom;
    console.log('centerView computed', { newX, newY });
    setViewport({ x: newX, y: newY });
  }, [canvasSize, state.present.rootNode, state.present.selectedNodeId, state.present.viewport.zoom, setViewport]);

  const setSearchTerm = useCallback((term: string) => historyDispatch({ type: 'SET_SEARCH_TERM', payload: term }), []);
  const toggleReadOnlyMode = useCallback((value?: boolean) => {
    const newIsReadOnly = value === undefined ? !presentState.isReadOnly : value;
    historyDispatch({ type: 'SET_READ_ONLY', payload: { isReadOnly: newIsReadOnly } });
    // 修复：切换为编辑模式时若 rootNode 为空自动初始化
    if (!newIsReadOnly && !presentState.rootNode) {
      const dataToLoad = initialDataProp || defaultRawData;
      const formattedData = transformToMindMapNode(dataToLoad);
      const initialAction = { type: 'LOAD_DATA', payload: { rootNode: formattedData } };
      const newState = mindMapReducer(initialMindMapState, initialAction as any);
      historyDispatch({
        type: 'REPLACE_STATE',
        payload: { past: [], present: newState, future: [] }
      } as any);
    }
  }, [presentState.isReadOnly, presentState.rootNode, historyDispatch, initialDataProp]);
  const toggleNodeCollapse = useCallback((nodeId: string) => {
    const previousData = deepCopyAST(presentState.rootNode);
    const nodeToToggle = previousData ? findNodeInAST(previousData, nodeId) : null;
    historyDispatch({ type: 'TOGGLE_NODE_COLLAPSE', payload: { nodeId } });
    setTimeout(() => {
      const updatedState = historyReducer(state, { type: 'TOGGLE_NODE_COLLAPSE', payload: { nodeId } });
      const currentData = updatedState.present.rootNode;
      const updatedNode = currentData ? findNodeInAST(currentData, nodeId) : undefined;
      let parentResult: { node: MindMapNode; parent: MindMapNode | null } | null = null;
      if (currentData) {
        parentResult = findNodeAndParentInAST(currentData, nodeId);
      }
      const idChain = nodeId ? (findIdChain(currentData, nodeId) || undefined) : undefined;
      const parentIdChain = parentResult?.parent ? (findIdChain(currentData, parentResult.parent.id) || undefined) : undefined;
      const currentNode = updatedNode || undefined;
      const parentNode = parentResult?.parent || undefined;
      const idChainNodes = findNodeChain(currentData, idChain);
      const parentIdChainNodes = findNodeChain(currentData, parentIdChain);
      const changeInfo = {
        ...createDataChangeInfo(
          OperationType.TOGGLE_NODE_COLLAPSE,
          currentData,
          previousData,
          [nodeId],
          undefined,
          undefined,
          updatedNode ? [updatedNode] : undefined,
          `${updatedNode?.isCollapsed ? '折叠' : '展开'}节点: ${nodeToToggle?.text || nodeId}`
        ),
        idChain,
        parentIdChain,
        currentNode,
        parentNode,
        idChainNodes,
        parentIdChainNodes,
      };
      triggerDataChangeCallback(changeInfo);
      if (onDataChange && currentData) onDataChange(currentData);
    }, 0);
  }, [presentState.rootNode, historyDispatch, state, createDataChangeInfo, triggerDataChangeCallback, onDataChange]);

  // 辅助函数：展开到目标节点的所有父节点
  const expandPathToNode = useCallback((nodeId: string) => {
    function findPath(node: MindMapNode | null, targetId: string, path: MindMapNode[] = []): MindMapNode[] | null {
      if (!node) return null;
      if (node.id === targetId) return [...path, node];
      for (const child of node.children || []) {
        const result = findPath(child, targetId, [...path, node]);
        if (result) return result;
      }
      return null;
    }
    const path = findPath(presentState.rootNode, nodeId);
    if (path) {
      // 除了最后一个（自己），其余全部展开
      path.slice(0, -1).forEach(n => {
        if (n.isCollapsed) historyDispatch({ type: 'TOGGLE_NODE_COLLAPSE', payload: { nodeId: n.id } });
      });
    }
  }, [presentState.rootNode, historyDispatch]);

  const goToNextMatch = useCallback(() => {
    historyDispatch({ type: 'GO_TO_NEXT_MATCH' });
    setTimeout(() => {
      const { searchMatches, currentMatchIndex } = state.present;
      if (searchMatches.length > 0) {
        const matchId = searchMatches[(currentMatchIndex + 1) % searchMatches.length];
        if (matchId) expandPathToNode(matchId);
      }
    }, 0);
  }, [historyDispatch, expandPathToNode]);

  const goToPreviousMatch = useCallback(() => {
    historyDispatch({ type: 'GO_TO_PREVIOUS_MATCH' });
    setTimeout(() => {
      const { searchMatches, currentMatchIndex } = state.present;
      if (searchMatches.length > 0) {
        const matchId = searchMatches[(currentMatchIndex - 1 + searchMatches.length) % searchMatches.length];
        if (matchId) expandPathToNode(matchId);
      }
    }, 0);
  }, [historyDispatch, expandPathToNode]);

  const undo = useCallback(() => {
    if (state.past.length === 0) return;
    const previousData = deepCopyAST(presentState.rootNode);
    historyDispatch({ type: 'UNDO' });
    setTimeout(() => {
      const updatedState = historyReducer(state, { type: 'UNDO' });
      const currentData = updatedState.present.rootNode;
      // 获取当前选中节点 id
      const selectedId = updatedState.present.selectedNodeId || updatedState.present.editingNodeId;
      const currentNode = selectedId && currentData ? findNodeInAST(currentData, selectedId) || undefined : undefined;
      let parentResult: { node: MindMapNode; parent: MindMapNode | null } | null = null;
      if (selectedId && currentData) {
        parentResult = findNodeAndParentInAST(currentData, selectedId);
      }
      const idChain = selectedId ? (findIdChain(currentData, selectedId) || undefined) : undefined;
      const parentIdChain = parentResult?.parent ? (findIdChain(currentData, parentResult.parent.id) || undefined) : undefined;
      const parentNode = parentResult?.parent || undefined;
      const idChainNodes = findNodeChain(currentData, idChain);
      const parentIdChainNodes = findNodeChain(currentData, parentIdChain);
      const changeInfo = {
        ...createDataChangeInfo(
          OperationType.UNDO,
          currentData,
          previousData,
          undefined,
          undefined,
          undefined,
          undefined,
          '撤销操作'
        ),
        idChain,
        parentIdChain,
        currentNode,
        parentNode,
        idChainNodes,
        parentIdChainNodes,
      };
      triggerDataChangeCallback(changeInfo);
      if (onDataChange && currentData) onDataChange(currentData);
    }, 0);
  }, [state.past.length, presentState.rootNode, historyDispatch, state, createDataChangeInfo, triggerDataChangeCallback, onDataChange]);

  const redo = useCallback(() => {
    if (state.future.length === 0) return;
    const previousData = deepCopyAST(presentState.rootNode);
    historyDispatch({ type: 'REDO' });
    setTimeout(() => {
      const updatedState = historyReducer(state, { type: 'REDO' });
      const currentData = updatedState.present.rootNode;
      // 获取当前选中节点 id
      const selectedId = updatedState.present.selectedNodeId || updatedState.present.editingNodeId;
      const currentNode = selectedId && currentData ? findNodeInAST(currentData, selectedId) || undefined : undefined;
      let parentResult: { node: MindMapNode; parent: MindMapNode | null } | null = null;
      if (selectedId && currentData) {
        parentResult = findNodeAndParentInAST(currentData, selectedId);
      }
      const idChain = selectedId ? (findIdChain(currentData, selectedId) || undefined) : undefined;
      const parentIdChain = parentResult?.parent ? (findIdChain(currentData, parentResult.parent.id) || undefined) : undefined;
      const parentNode = parentResult?.parent || undefined;
      const idChainNodes = findNodeChain(currentData, idChain);
      const parentIdChainNodes = findNodeChain(currentData, parentIdChain);
      const changeInfo = {
        ...createDataChangeInfo(
          OperationType.REDO,
          currentData,
          previousData,
          undefined,
          undefined,
          undefined,
          undefined,
          '重做操作'
        ),
        idChain,
        parentIdChain,
        currentNode,
        parentNode,
        idChainNodes,
        parentIdChainNodes,
      };
      triggerDataChangeCallback(changeInfo);
      if (onDataChange && currentData) onDataChange(currentData);
    }, 0);
  }, [state.future.length, presentState.rootNode, historyDispatch, state, createDataChangeInfo, triggerDataChangeCallback, onDataChange]);

  // 辅助函数：查找 id 链路
  function findIdChain(root: MindMapNode | null, targetId: string): string[] | null {
    if (!root) return null;
    if (root.id === targetId) return [root.id];
    for (const child of root.children) {
      const childChain = findIdChain(child, targetId);
      if (childChain) return [root.id, ...childChain];
    }
    return null;
  }

  // 辅助函数：根据 id 链路获取节点对象数组
  function findNodeChain(root: MindMapNode | null, idChain: string[] | undefined): MindMapNode[] | undefined {
    if (!root || !idChain || idChain.length === 0) return undefined;
    const result: MindMapNode[] = [];
    let current: MindMapNode | null = root;
    for (const id of idChain) {
      if (!current || current.id !== id) {
        // 在当前节点的 children 里找
        current = (current?.children || []).find(child => child.id === id) || null;
      }
      if (current) result.push(current);
      else break;
    }
    return result.length === idChain.length ? result : undefined;
  }

  return {
    state: presentState,
    dispatch: historyDispatch,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    undo,
    redo,
    addNode, deleteNode, setSelectedNode, setEditingNode, setViewport, pan, zoom, fitView, setSearchTerm, toggleReadOnlyMode, toggleNodeCollapse, goToNextMatch, goToPreviousMatch, updateNodeText,
    zoomIn,
    zoomOut,
    centerView,
    typeConfig
  };
}
