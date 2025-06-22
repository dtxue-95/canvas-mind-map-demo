
# 1. Create the main library component: src/lib/ReactMindMap.tsx
# This encapsulates all the logic from the original App.tsx
cat << 'EOT' > src/lib/ReactMindMap.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Toolbar } from './components/Toolbar';
import { MindMapCanvas } from './components/MindMapCanvas';
import { BottomViewportToolbar } from './components/BottomViewportToolbar';
import { SearchWidget } from './components/SearchWidget';
import { useMindMap } from './hooks/useMindMap';
import { CommandDescriptor, MindMapNodeAST, Point } from './types';
import { NEW_NODE_TEXT } from './constants';
import { findNodeInAST, findNodeAndParentInAST } from './utils/nodeUtils';
import { worldToScreen } from './utils/canvasUtils';
import { FaPlus, FaMinus, FaTrash, FaSitemap, FaSearch, FaExpandArrowsAlt, FaCompressArrowsAlt, FaLock, FaUnlock, FaCrosshairs, FaVectorSquare } from 'react-icons/fa';

const HANDLE_WIDTH = 32;
const HANDLE_HEIGHT = 64;
const HANDLE_VERTICAL_PADDING = 10;

export interface ReactMindMapProps {
  initialData: any;
  width?: string;
  height?: string;
}

export const ReactMindMap: React.FC<ReactMindMapProps> = ({ initialData, width = '100vw', height = '100vh' }) => {
  const [canvasSize, setCanvasSize] = useState<{width: number, height: number} | null>(null);
  const mindMapHook = useMindMap(canvasSize, initialData);
  const { state, addNode, deleteNode, zoom, setViewport, setSearchTerm, toggleReadOnlyMode, pan, fitView } = mindMapHook;
  
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const appContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const [topHandlePosition, setTopHandlePosition] = useState({ x: 0, y: 0 });
  const [bottomHandlePosition, setBottomHandlePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (canvasContainerRef.current) {
      setTopHandlePosition({ x: canvasContainerRef.current.clientWidth - HANDLE_WIDTH, y: canvasContainerRef.current.clientHeight * 0.25 });
      setBottomHandlePosition({ x: canvasContainerRef.current.clientWidth - HANDLE_WIDTH, y: canvasContainerRef.current.clientHeight * 0.75 });
    }
  }, [canvasSize]);

  const updateTopHandlePosition = (newPos: { x: number; y: number }) => {
    const parentHeight = canvasContainerRef.current?.clientHeight ?? window.innerHeight;
    const newY = Math.max(0, Math.min(newPos.y, bottomHandlePosition.y - HANDLE_HEIGHT - HANDLE_VERTICAL_PADDING));
    setTopHandlePosition({ x: newPos.x, y: newY });
  };

  const updateBottomHandlePosition = (newPos: { x: number; y: number }) => {
    const parentHeight = canvasContainerRef.current?.clientHeight ?? window.innerHeight;
    const newY = Math.min(parentHeight - HANDLE_HEIGHT, Math.max(newPos.y, topHandlePosition.y + HANDLE_HEIGHT + HANDLE_VERTICAL_PADDING));
    setBottomHandlePosition({ x: newPos.x, y: newY });
  };
  
  useEffect(() => {
    const updateSize = () => {
      if (canvasContainerRef.current) {
        setCanvasSize({ width: canvasContainerRef.current.clientWidth, height: canvasContainerRef.current.clientHeight });
      }
    };
    const resizeObserver = new ResizeObserver(updateSize);
    const target = appContainerRef.current;
    if (target) {
      resizeObserver.observe(target);
      updateSize();
    }
    return () => { if (target) resizeObserver.unobserve(target); };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const nodeIdToFocus = state.editingNodeId || state.selectedNodeId;
    const nodeToFocus = nodeIdToFocus ? findNodeInAST(state.rootNode, nodeIdToFocus) : null;
    if (nodeToFocus && canvasSize) {
        const nodeCenterWorld: Point = { x: nodeToFocus.position.x + nodeToFocus.width / 2, y: nodeToFocus.position.y + nodeToFocus.height / 2 };
        const nodeScreenCenterPos = worldToScreen(nodeCenterWorld, state.viewport);
        const marginX = Math.min(100, canvasSize.width * 0.1);
        const marginY = Math.min(80, canvasSize.height * 0.1);
        let dxPan = 0, dyPan = 0;
        if (nodeScreenCenterPos.x > canvasSize.width - marginX) dxPan = canvasSize.width - marginX - nodeScreenCenterPos.x;
        else if (nodeScreenCenterPos.x < marginX) dxPan = marginX - nodeScreenCenterPos.x;
        if (nodeScreenCenterPos.y > canvasSize.height - marginY) dyPan = canvasSize.height - marginY - nodeScreenCenterPos.y;
        else if (nodeScreenCenterPos.y < marginY) dyPan = marginY - nodeScreenCenterPos.y;
        if (dxPan !== 0 || dyPan !== 0) pan(dxPan, dyPan);
    }
  }, [state.editingNodeId, state.selectedNodeId, state.rootNode, state.viewport, canvasSize, pan]);
  
  const zoomPercentage = Math.round(state.viewport.zoom * 100);

  const topToolbarCommands = useMemo<CommandDescriptor[]>(() => {
    const canAddChild = !!state.selectedNodeId;
    const handleDeleteNodeCommand = () => { if (state.selectedNodeId) deleteNode(state.selectedNodeId); };
    return [
      { id: 'add-node', label: '添加节点', action: () => addNode(NEW_NODE_TEXT, null), disabled: state.isReadOnly, title: '添加兄弟节点', icon: FaPlus },
      { id: 'add-child', label: '添加子节点', action: () => { if (state.selectedNodeId) addNode(NEW_NODE_TEXT, state.selectedNodeId); }, disabled: !canAddChild || state.isReadOnly, title: '添加子节点', icon: FaSitemap },
      { id: 'delete-node', label: '删除节点', action: handleDeleteNodeCommand, disabled: !state.selectedNodeId || state.isReadOnly, title: '删除节点', icon: FaTrash },
    ];
  }, [state.selectedNodeId, state.isReadOnly, addNode, deleteNode]);
  
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) appContainerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  const bottomToolbarCommands = useMemo<CommandDescriptor[]>(() => [
      { id: 'zoom-out', label: '缩小', action: () => { if (canvasSize) zoom(150, { x: canvasSize.width / 2, y: canvasSize.height / 2 }); }, title: '缩小', icon: FaMinus },
      { id: 'zoom-in', label: '放大', action: () => { if (canvasSize) zoom(-100, { x: canvasSize.width / 2, y: canvasSize.height / 2 }); }, title: '放大', icon: FaPlus },
      { id: 'center-content', label: '居中', action: () => fitView(true), title: '居中内容', icon: FaCrosshairs },
      { id: 'fit-view', label: '适应', action: () => fitView(false), title: '适应视图', icon: FaVectorSquare },
      { id: 'toggle-fullscreen', label: isFullscreen ? '退出全屏' : '全屏', action: handleToggleFullscreen, title: isFullscreen ? '退出全屏' : '进入全屏', icon: isFullscreen ? FaCompressArrowsAlt : FaExpandArrowsAlt },
      { id: 'toggle-readonly', label: state.isReadOnly ? '可编辑' : '只读', action: toggleReadOnlyMode, title: state.isReadOnly ? '切换为可编辑模式' : '切换为只读模式', icon: state.isReadOnly ? FaUnlock : FaLock },
      { id: 'search', label: '搜索', action: () => setIsSearchVisible(v => !v), title: '搜索节点', icon: FaSearch },
  ], [canvasSize, isFullscreen, state.isReadOnly, zoom, fitView, toggleReadOnlyMode]);

  return (
    <div ref={appContainerRef} style={{ width, height }} className="flex flex-col bg-gray-200 overflow-hidden relative">
      <Toolbar commands={topToolbarCommands} handlePosition={topHandlePosition} onPositionChange={updateTopHandlePosition} />
      <div ref={canvasContainerRef} className="flex-grow w-full h-full relative overflow-hidden">
        {canvasSize && <MindMapCanvas mindMapHookInstance={mindMapHook} />}
      </div>
      <BottomViewportToolbar commands={bottomToolbarCommands} zoomPercentage={zoomPercentage} handlePosition={bottomHandlePosition} onPositionChange={updateBottomHandlePosition} />
      {isSearchVisible && (
        <SearchWidget isVisible={isSearchVisible} searchTerm={state.currentSearchTerm} onSearchTermChange={setSearchTerm} onClose={() => setIsSearchVisible(false)} />
      )}
    </div>
  );
};
EOT

# 2. Update the main hook: src/lib/hooks/useMindMap.ts
cat << 'EOT' > src/lib/hooks/useMindMap.ts
import React, { useReducer, useCallback, useEffect } from 'react';
import { MindMapNodeAST, Point, Viewport, MindMapState, MindMapAction, AddNodeCommandArgs, DeleteNodeCommandArgs } from '../types';
import { INITIAL_ZOOM, MIN_ZOOM, MAX_ZOOM, ZOOM_SENSITIVITY, CHILD_H_SPACING } from '../constants';
import { createNode, countAllDescendants, deepCopyAST, findNodeInAST, findNodeAndParentInAST, transformToMindMapNode } from '../utils/nodeUtils';
import { applyLayout } from '../layoutEngine';
import { AddNodeCommand } from '../commands/addNodeCommand';
import { DeleteNodeCommand } from '../commands/deleteNodeCommand';
import { rawInitialData as defaultRawData } from '../initialData';

const initialState: MindMapState = { rootNode: null, selectedNodeId: null, editingNodeId: null, viewport: { x: 0, y: 0, zoom: INITIAL_ZOOM }, currentSearchTerm: "", highlightedNodeIds: new Set<string>(), exactMatchNodeIds: new Set<string>(), isReadOnly: false };

function mindMapReducer(state: MindMapState, action: MindMapAction): MindMapState {
    switch (action.type) {
        case 'LOAD_DATA': {
            const copiedRoot = deepCopyAST(action.payload.rootNode);
            const laidOutData = copiedRoot ? applyLayout(copiedRoot) : null;
            return { ...initialState, rootNode: laidOutData, selectedNodeId: laidOutData ? laidOutData.id : null, viewport: { x: (0 + CHILD_H_SPACING / 2), y: 0, zoom: INITIAL_ZOOM } };
        }
        case 'APPLY_ADD_NODE_RESULT': return { ...state, rootNode: action.payload.rootNode };
        case 'APPLY_DELETE_NODE_RESULT': {
            const { rootNode, newSelectedNodeId, deletedNodeIds } = action.payload;
            return { ...state, rootNode, selectedNodeId: newSelectedNodeId, editingNodeId: state.editingNodeId && deletedNodeIds.has(state.editingNodeId) ? null : state.editingNodeId };
        }
        case 'SET_SELECTED_NODE': return { ...state, selectedNodeId: action.payload.nodeId, editingNodeId: null };
        case 'SET_EDITING_NODE': return { ...state, editingNodeId: action.payload.nodeId, selectedNodeId: action.payload.nodeId };
        case 'SET_VIEWPORT': return { ...state, viewport: { ...state.viewport, ...action.payload } };
        case 'TOGGLE_READ_ONLY': return { ...state, isReadOnly: !state.isReadOnly, editingNodeId: null };
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
            const originalTerm = action.payload;
            const searchTerm = originalTerm.toLowerCase().trim();
            const newHighlightedNodeIds = new Set<string>();
            const nodesToExpand = new Set<string>();
            let newRootNode = state.rootNode;
            let bestMatchNodeId: string | null = null;
            let maxMatchCount = 0;
            if (searchTerm) {
                const countOccurrences = (str: string, sub: string) => (str.toLowerCase().match(new RegExp(sub.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
                function findPathToNode(node: MindMapNodeAST, targetId: string, path: string[] = []): string[] | null {
                    path.push(node.id);
                    if (node.id === targetId) return path;
                    for (const child of node.children) {
                        const foundPath = findPathToNode(child, targetId, [...path]);
                        if (foundPath) return foundPath;
                    }
                    return null;
                }
                function traverseAndHighlight(node: MindMapNodeAST | null) {
                    if (!node) return;
                    const matchCount = countOccurrences(node.text, searchTerm);
                    if (matchCount > 0) {
                        newHighlightedNodeIds.add(node.id);
                        if (matchCount > maxMatchCount) {
                            maxMatchCount = matchCount;
                            bestMatchNodeId = node.id;
                        }
                        if (state.rootNode) {
                            const path = findPathToNode(state.rootNode, node.id);
                            path?.forEach(ancestorId => nodesToExpand.add(ancestorId));
                        }
                    }
                    node.children.forEach(traverseAndHighlight);
                }
                traverseAndHighlight(state.rootNode);
                if (nodesToExpand.size > 0) {
                    const tempRoot = deepCopyAST(state.rootNode);
                    if (tempRoot) {
                        nodesToExpand.forEach(nodeId => {
                            const node = findNodeInAST(tempRoot, nodeId);
                            if (node && node.children.length > 0) node.isCollapsed = false;
                        });
                        newRootNode = applyLayout(tempRoot);
                    }
                }
            }
            const newExactMatchNodeIds = new Set<string>();
            if (bestMatchNodeId) newExactMatchNodeIds.add(bestMatchNodeId);
            return { ...state, rootNode: newRootNode, currentSearchTerm: originalTerm, highlightedNodeIds: newHighlightedNodeIds, exactMatchNodeIds: newExactMatchNodeIds };
        }
        default: return state;
    }
}

export function useMindMap(canvasSize?: { width: number; height: number } | null, initialDataProp?: any) {
  const [state, dispatch] = useReducer(mindMapReducer, initialState);

  useEffect(() => {
    const dataToLoad = initialDataProp || defaultRawData;
    const formattedData = transformToMindMapNode(dataToLoad);
    dispatch({ type: 'LOAD_DATA', payload: { rootNode: formattedData } });
  }, [initialDataProp]);

  const setViewport = useCallback((viewportUpdate: Partial<Viewport>) => dispatch({ type: 'SET_VIEWPORT', payload: viewportUpdate }), []);
  const addNode = useCallback((text: string, targetParentId?: string | null) => AddNodeCommand.execute(state.rootNode, { text, targetParentId }), [state.rootNode]);
  const deleteNode = useCallback((nodeIdToDelete: string) => DeleteNodeCommand.execute(state.rootNode, { nodeIdToDelete }), [state.rootNode]);
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
    function getBoundsRecursive(node: MindMapNodeAST) {
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
  const toggleReadOnlyMode = useCallback(() => dispatch({ type: 'TOGGLE_READ_ONLY' }), []);
  const toggleNodeCollapse = useCallback((nodeId: string) => dispatch({ type: 'TOGGLE_NODE_COLLAPSE', payload: { nodeId } }), []);

  return { state, dispatch, addNode, deleteNode, setSelectedNode, setEditingNode, setViewport, pan, zoom, fitView, setSearchTerm, toggleReadOnlyMode, toggleNodeCollapse };
}
EOT

# 3. Create the library entry point: src/lib/index.ts
cat << 'EOT' > src/lib/index.ts
import './styles.css';
export * from './ReactMindMap';
export * from './types';
EOT

# 4. Create the library styles: src/lib/styles.css
cat << 'EOT' > src/lib/styles.css
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
EOT

# 5. Create the example app: src/App.tsx
cat << 'EOT' > src/App.tsx
import React from 'react';
import { ReactMindMap } from './lib';
import { rawInitialData } from './lib/initialData';
import './lib/styles.css';

function App() {
  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <header style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ddd' }}>
        <h1>React Mind Map - NPM Package Demo</h1>
        <p>This is an example of using the ReactMindMap component published from the 'src/lib' directory.</p>
      </header>
      <main>
        <ReactMindMap initialData={rawInitialData} />
      </main>
    </div>
  );
}

export default App;
EOT

# 6. Clear out the old root stylesheet: src/styles/index.css
> src/styles/index.css

# 7. Fix paths in remaining components (this is crucial)
# MindMapCanvas
sed -i '' "s|from '../hooks/useMindMap'|from './hooks/useMindMap'|" src/lib/components/MindMapCanvas.tsx
sed -i '' "s|from '../types'|from '../types'|" src/lib/components/MindMapCanvas.tsx
sed -i '' "s|from '../utils/canvasUtils'|from '../utils/canvasUtils'|" src/lib/components/MindMapCanvas.tsx
sed -i '' "s|from '../constants'|from '../constants'|" src/lib/components/MindMapCanvas.tsx
sed -i '' "s|from '../utils/nodeUtils'|from '../utils/nodeUtils'|" src/lib/components/MindMapCanvas.tsx
# Toolbar
sed -i '' "s|from '../types'|from '../types'|" src/lib/components/Toolbar.tsx
# BottomViewportToolbar
sed -i '' "s|from '../types'|from '../types'|" src/lib/components/BottomViewportToolbar.tsx
# NodeEditInput
sed -i '' "s|from '../types'|from '../types'|" src/lib/components/NodeEditInput.tsx
sed -i '' "s|from '../utils/canvasUtils'|from '../utils/canvasUtils'|" src/lib/components/NodeEditInput.tsx
sed -i '' "s|from '../constants'|from '../constants'|" src/lib/components/NodeEditInput.tsx
# SearchWidget
sed -i '' "s|from '../types'|from '../types'|" src/lib/components/SearchWidget.tsx
# addNodeCommand
sed -i '' "s|from '../types'|from '../types'|" src/lib/commands/addNodeCommand.ts
sed -i '' "s|from '../utils/nodeUtils'|from '../utils/nodeUtils'|" src/lib/commands/addNodeCommand.ts
sed -i '' "s|from '../layoutEngine'|from '../layoutEngine'|" src/lib/commands/addNodeCommand.ts
sed -i '' "s|from '../constants'|from '../constants'|" src/lib/commands/addNodeCommand.ts
# deleteNodeCommand
sed -i '' "s|from '../types'|from '../types'|" src/lib/commands/deleteNodeCommand.ts
sed -i '' "s|from '../utils/nodeUtils'|from '../utils/nodeUtils'|" src/lib/commands/deleteNodeCommand.ts
sed -i '' "s|from '../layoutEngine'|from '../layoutEngine'|" src/lib/commands/deleteNodeCommand.ts
# canvasUtils
sed -i '' "s|from '../types'|from '../types'|" src/lib/utils/canvasUtils.ts
sed -i '' "s|from '../constants'|from '../constants'|" src/lib/utils/canvasUtils.ts
# nodeUtils
sed -i '' "s|from '../types'|from '../types'|" src/lib/utils/nodeUtils.ts
sed -i '' "s|from '../constants'|from '../constants'|" src/lib/utils/nodeUtils.ts
# layoutEngine
sed -i '' "s|from '../types'|from '../types'|" src/lib/layoutEngine.ts
sed -i '' "s|from '../constants'|from '../constants'|" src/lib/layoutEngine.ts
sed -i '' "s|from '../utils/canvasUtils'|from '../utils/canvasUtils'|" src/lib/layoutEngine.ts
sed -i '' "s|from '../utils/nodeUtils'|from '../utils/nodeUtils'|" src/lib/layoutEngine.ts

