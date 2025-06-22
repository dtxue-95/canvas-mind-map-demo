import { useReducer, useCallback, useEffect } from 'react';
import { MindMapNode, Point, Viewport, MindMapState, MindMapAction } from '../types';
import { INITIAL_ZOOM, MIN_ZOOM, MAX_ZOOM, ZOOM_SENSITIVITY, CHILD_H_SPACING } from '../constants';
import { countAllDescendants, deepCopyAST, findNodeInAST, transformToMindMapNode } from '../utils/nodeUtils';
import { applyLayout } from '../layoutEngine';
import { AddNodeCommand } from '../commands/addNodeCommand';
import { DeleteNodeCommand } from '../commands/deleteNodeCommand';
import { rawInitialData as defaultRawData } from '../initialData';
import React from 'react';

const initialState: MindMapState = {
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

function mindMapReducer(state: MindMapState, action: MindMapAction): MindMapState {
    switch (action.type) {
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
        case 'APPLY_ADD_NODE_RESULT': return { ...state, rootNode: action.payload.rootNode };
        case 'APPLY_DELETE_NODE_RESULT': {
            const { rootNode, newSelectedNodeId, deletedNodeIds } = action.payload;
            return { ...state, rootNode, selectedNodeId: newSelectedNodeId, editingNodeId: state.editingNodeId && deletedNodeIds.has(state.editingNodeId) ? null : state.editingNodeId };
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

export function useMindMap(
    canvasSize?: { width: number; height: number } | null, 
    initialDataProp?: any,
) {
  const [state, dispatch] = useReducer(mindMapReducer, initialState);

  useEffect(() => {
    const dataToLoad = initialDataProp || defaultRawData;
    const formattedData = transformToMindMapNode(dataToLoad);
    dispatch({ type: 'LOAD_DATA', payload: { rootNode: formattedData } });
  }, [initialDataProp]);

  const setViewport = useCallback((viewportUpdate: Partial<Viewport>) => dispatch({ type: 'SET_VIEWPORT', payload: viewportUpdate }), []);
  const addNode = useCallback((text: string, targetParentId?: string | null) => {
    const result = AddNodeCommand.execute(state.rootNode, { text, targetParentId });
    dispatch({ type: 'APPLY_ADD_NODE_RESULT', payload: result });
  }, [state.rootNode]);
  const deleteNode = useCallback((nodeIdToDelete: string) => {
    const result = DeleteNodeCommand.execute(state.rootNode, { nodeIdToDelete });
    dispatch({ type: 'APPLY_DELETE_NODE_RESULT', payload: result });
  }, [state.rootNode]);
  const setSelectedNode = useCallback((nodeId: string | null) => dispatch({ type: 'SET_SELECTED_NODE', payload: { nodeId } }), []);
  const setEditingNode = useCallback((nodeId: string | null) => { if (!state.isReadOnly || nodeId === null) dispatch({ type: 'SET_EDITING_NODE', payload: { nodeId } }); }, [state.isReadOnly]);
  const pan = useCallback((dx: number, dy: number) => setViewport({ x: state.viewport.x + dx, y: state.viewport.y + dy }), [state.viewport.x, state.viewport.y, setViewport]);
  const zoom = useCallback((delta: number, mousePosition: Point) => {
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, state.viewport.zoom * (1 - delta * ZOOM_SENSITIVITY)));
    const worldPos = { x: (mousePosition.x - state.viewport.x) / state.viewport.zoom, y: (mousePosition.y - state.viewport.y) / state.viewport.zoom };
    const newViewportX = mousePosition.x - worldPos.x * newZoom;
    const newViewportY = mousePosition.y - worldPos.y * newZoom;
    setViewport({ x: newViewportX, y: newViewportY, zoom: newZoom });
  }, [state.viewport, setViewport]);

  const fitView = useCallback((centerOnly = false) => {
    if (!state.rootNode || !canvasSize) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    function getBoundsRecursive(node: MindMapNode) {
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + node.width);
        maxY = Math.max(maxY, node.position.y + node.height);
        if (!node.isCollapsed) node.children.forEach(getBoundsRecursive);
    }
    getBoundsRecursive(state.rootNode);
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    if (contentWidth <= 0 || contentHeight <= 0) return;
    const padding = 50;
    const newZoom = centerOnly ? state.viewport.zoom : Math.min((canvasSize.width - padding * 2) / contentWidth, (canvasSize.height - padding * 2) / contentHeight, MAX_ZOOM);
    const newX = (canvasSize.width / 2) - ((minX + contentWidth / 2) * newZoom);
    const newY = (canvasSize.height / 2) - ((minY + contentHeight / 2) * newZoom);
    setViewport({ x: newX, y: newY, zoom: newZoom });
  }, [state.rootNode, canvasSize, state.viewport.zoom, setViewport]);

  const setSearchTerm = useCallback((term: string) => dispatch({ type: 'SET_SEARCH_TERM', payload: term }), []);
  const toggleReadOnlyMode = useCallback((value?: boolean) => {
    const newIsReadOnly = value === undefined ? !state.isReadOnly : value;
    dispatch({ type: 'SET_READ_ONLY', payload: { isReadOnly: newIsReadOnly } });
  }, [state.isReadOnly]);
  const toggleNodeCollapse = useCallback((nodeId: string) => dispatch({ type: 'TOGGLE_NODE_COLLAPSE', payload: { nodeId } }), []);
  const goToNextMatch = useCallback(() => dispatch({ type: 'GO_TO_NEXT_MATCH' }), []);
  const goToPreviousMatch = useCallback(() => dispatch({ type: 'GO_TO_PREVIOUS_MATCH' }), []);

  return { state, dispatch, addNode, deleteNode, setSelectedNode, setEditingNode, setViewport, pan, zoom, fitView, setSearchTerm, toggleReadOnlyMode, toggleNodeCollapse, goToNextMatch, goToPreviousMatch };
}
