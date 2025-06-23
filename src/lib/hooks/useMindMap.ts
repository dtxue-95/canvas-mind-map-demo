import { useReducer, useCallback, useEffect } from 'react';
import { MindMapNode, Point, Viewport, MindMapAction, AddNodePayload, DeleteNodePayload, MindMapState } from '../types';
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

function mindMapReducer(state: MindMapState = initialMindMapState, action: MindMapAction): MindMapState {
  switch (action.type) {
    case 'REPLACE_STATE': // Special action to replace the whole state for history reset
      return (action as any).payload.present; // Return the present part of the payload
    case 'INIT_MAP':
      return state;
    case 'ADD_NODE': {
      if (!state.rootNode) return state; // Or handle creating a root node
      const { text, parentId } = (action as { type: 'ADD_NODE', payload: AddNodePayload }).payload;
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
      };

      parent.children.push(newNode);

      const laidOutRoot = applyLayout(newRoot);
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

      const laidOutRoot = applyLayout(newRoot);

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
      const laidOutData = copiedRoot ? applyLayout(copiedRoot) : null;
      return { ...state, rootNode: laidOutData, selectedNodeId: laidOutData ? laidOutData.id : null, viewport: { x: (0 + CHILD_H_SPACING / 2), y: 0, zoom: INITIAL_ZOOM } };
    }
    case 'UPDATE_NODE_TEXT': {
      const { nodeId, text } = action.payload;
      const newRootNode = deepCopyAST(state.rootNode);
      const nodeToUpdate = findNodeInAST(newRootNode, nodeId);
      if (nodeToUpdate) {
        nodeToUpdate.text = text;
      }
      // After updating text, we MUST re-layout to get new dimensions
      const laidOutRoot = newRootNode ? applyLayout(newRootNode) : null;
      return { ...state, rootNode: laidOutRoot };
    }
    case 'SET_SELECTED_NODE': return { ...state, selectedNodeId: action.payload.nodeId, editingNodeId: null };
    case 'SET_EDITING_NODE': return { ...state, editingNodeId: action.payload.nodeId, selectedNodeId: action.payload.nodeId };
    case 'SET_VIEWPORT': return { ...state, viewport: { ...state.viewport, ...action.payload } };
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
      const laidOutRoot = applyLayout(newRootNode);
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

// Higher-order reducer for history
const undoable = (reducer: typeof mindMapReducer) => {
  // The new initial state for our history-aware reducer
  const initialHistoryState: HistoryState = {
    past: [],
    present: reducer(initialMindMapState, { type: 'INIT_MAP' }),
    future: [],
  };

  return (state: HistoryState = initialHistoryState, action: MindMapAction | { type: 'UNDO' } | { type: 'REDO' }): HistoryState => {
    const { past, present, future } = state;

    switch (action.type) {
      case 'UNDO':
        if (past.length === 0) return state;
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        return {
          past: newPast,
          present: previous,
          future: [present, ...future],
        };
      case 'REDO':
        if (future.length === 0) return state;
        const next = future[0];
        const newFuture = future.slice(1);
        return {
          past: [...past, present],
          present: next,
          future: newFuture,
        };
      default:
        // These actions should not be part of the undo history
        const nonUndoableActions = new Set([
          'SET_SELECTED_NODE', 'SET_EDITING_NODE', 'SET_VIEWPORT', 'SET_READ_ONLY',
          'SET_SEARCH_TERM', 'GO_TO_NEXT_MATCH', 'GO_TO_PREVIOUS_MATCH'
        ]);

        const newPresent = reducer(present, action as MindMapAction);

        if (present === newPresent) {
          return state;
        }

        if (nonUndoableActions.has(action.type)) {
          return { past, present: newPresent, future };
        }

        // For undoable actions, clear the future
        return {
          past: [...past, present],
          present: newPresent,
          future: [],
        };
    }
  };
};


const historyReducer = undoable(mindMapReducer);

export function useMindMap(
  canvasSize?: { width: number; height: number } | null,
  initialDataProp?: any,
) {
  const [state, dispatch] = useReducer(historyReducer, undefined, () => historyReducer(initialHistoryState, { type: 'INIT_MAP' }));

  useEffect(() => {
    const dataToLoad = initialDataProp || defaultRawData;
    const formattedData = transformToMindMapNode(dataToLoad);
    // LOAD_DATA should reset the history
    const initialAction = { type: 'LOAD_DATA', payload: { rootNode: formattedData } };
    dispatch({
      type: 'REPLACE_STATE',
      payload: { past: [], present: mindMapReducer(initialMindMapState, initialAction as any), future: [] }
    } as any); // Use `any` to bypass strict type check for this special action
  }, [initialDataProp]);

  const { state: presentState, dispatch: historyDispatch } = { state: state.present, dispatch };

  const updateNodeText = useCallback((nodeId: string, text: string) => {
    historyDispatch({ type: 'UPDATE_NODE_TEXT', payload: { nodeId, text } });
  }, []);

  const setViewport = useCallback((viewportUpdate: Partial<Viewport>) => historyDispatch({ type: 'SET_VIEWPORT', payload: viewportUpdate }), []);

  const addNode = useCallback((text: string, parentId: string | null = null) => {
    historyDispatch({ type: 'ADD_NODE', payload: { text, parentId } });
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    historyDispatch({ type: 'DELETE_NODE', payload: { nodeId } });
  }, []);

  const setSelectedNode = useCallback((nodeId: string | null) => historyDispatch({ type: 'SET_SELECTED_NODE', payload: { nodeId } }), []);
  const setEditingNode = useCallback((nodeId: string | null) => { if (!presentState.isReadOnly || nodeId === null) historyDispatch({ type: 'SET_EDITING_NODE', payload: { nodeId } }); }, [presentState.isReadOnly]);
  const pan = useCallback((dx: number, dy: number) => setViewport({ x: presentState.viewport.x + dx, y: presentState.viewport.y + dy }), [presentState.viewport.x, presentState.viewport.y, setViewport]);

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
    if (!presentState.rootNode || !canvasSize) return;
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
    if (contentWidth <= 0 || contentHeight <= 0) return;
    const padding = 50;
    const newZoom = centerOnly ? presentState.viewport.zoom : Math.min((canvasSize.width - padding * 2) / contentWidth, (canvasSize.height - padding * 2) / contentHeight, MAX_ZOOM);
    const newX = (canvasSize.width / 2) - ((minX + contentWidth / 2) * newZoom);
    const newY = (canvasSize.height / 2) - ((minY + contentHeight / 2) * newZoom);
    setViewport({ x: newX, y: newY, zoom: newZoom });
  }, [presentState.rootNode, canvasSize, presentState.viewport.zoom, setViewport]);

  const centerView = useCallback(() => {
    if (!canvasSize || !state.present.rootNode) return;
    const nodeToCenterId = state.present.selectedNodeId || state.present.rootNode.id;
    const node = findNodeInAST(state.present.rootNode, nodeToCenterId);
    if (node) {
      const nodeCenter = { x: node.position.x + node.width / 2, y: node.position.y + node.height / 2 };
      const newX = canvasSize.width / 2 - nodeCenter.x * state.present.viewport.zoom;
      const newY = canvasSize.height / 2 - nodeCenter.y * state.present.viewport.zoom;
      setViewport({ x: newX, y: newY });
    }
  }, [canvasSize, state.present.rootNode, state.present.selectedNodeId, state.present.viewport.zoom, setViewport]);

  const setSearchTerm = useCallback((term: string) => historyDispatch({ type: 'SET_SEARCH_TERM', payload: term }), []);
  const toggleReadOnlyMode = useCallback((value?: boolean) => {
    const newIsReadOnly = value === undefined ? !presentState.isReadOnly : value;
    historyDispatch({ type: 'SET_READ_ONLY', payload: { isReadOnly: newIsReadOnly } });
  }, [presentState.isReadOnly]);
  const toggleNodeCollapse = useCallback((nodeId: string) => historyDispatch({ type: 'TOGGLE_NODE_COLLAPSE', payload: { nodeId } }), []);

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
    // 跳转后自动展开到目标节点
    setTimeout(() => {
      const matchId = state.present.searchMatches[(state.present.currentMatchIndex + 1) % state.present.searchMatches.length];
      if (matchId) expandPathToNode(matchId);
    }, 0);
  }, [historyDispatch, state.present.searchMatches, state.present.currentMatchIndex, expandPathToNode]);

  const goToPreviousMatch = useCallback(() => {
    historyDispatch({ type: 'GO_TO_PREVIOUS_MATCH' });
    setTimeout(() => {
      const matchId = state.present.searchMatches[(state.present.currentMatchIndex - 1 + state.present.searchMatches.length) % state.present.searchMatches.length];
      if (matchId) expandPathToNode(matchId);
    }, 0);
  }, [historyDispatch, state.present.searchMatches, state.present.currentMatchIndex, expandPathToNode]);

  const undo = useCallback(() => historyDispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => historyDispatch({ type: 'REDO' }), []);

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
  };
}
