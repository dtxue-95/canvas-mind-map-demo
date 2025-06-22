import React, { useState, useRef, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import MindMapCanvas from './components/MindMapCanvas';
import BottomViewportToolbar from './components/BottomViewportToolbar';
import SearchWidget from './components/SearchWidget';
import { useMindMap } from './hooks/useMindMap';
import { MindMapNodeAST, ToolbarButtonConfig, Point } from './types';
import { findNodeInAST } from './utils/nodeUtils';
import { worldToScreen } from './utils/canvasUtils';
import { getDefaultTopToolbarConfig, getDefaultBottomToolbarConfig } from './defaultConfig';

export interface ReactMindMapProps {
  initialData: MindMapNodeAST;
  width?: string;
  height?: string;
  topToolbarConfig?: ToolbarButtonConfig[];
  bottomToolbarConfig?: ToolbarButtonConfig[];
  showTopToolbar?: boolean;
  showBottomToolbar?: boolean;
  readOnly?: boolean;
  onDataChange?: (data: MindMapNodeAST) => void;
}

export default function ReactMindMap({
  initialData,
  width = '100vw',
  height = '100vh',
  topToolbarConfig,
  bottomToolbarConfig,
  showTopToolbar = true,
  showBottomToolbar = true,
  readOnly = false,
  onDataChange,
}: ReactMindMapProps) {
  const appContainerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  const mindMapHook = useMindMap(canvasSize, initialData, readOnly);
  const { state, pan, toggleReadOnlyMode, goToNextMatch, goToPreviousMatch, setSearchTerm } = mindMapHook;

  const [topHandlePosition, setTopHandlePosition] = useState({ x: 0, y: 0 });
  const [bottomHandlePosition, setBottomHandlePosition] = useState({ x: 0, y: 0 });
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateSize = () => {
      if (canvasContainerRef.current) {
        const { width, height } = canvasContainerRef.current.getBoundingClientRect();
        setCanvasSize({ width, height });
        setTopHandlePosition({ x: width - 32, y: height * 0.25 });
        setBottomHandlePosition({ x: width - 32, y: height * 0.75 });
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
    const forcedReadOnly = !showBottomToolbar;
    toggleReadOnlyMode(readOnly || forcedReadOnly);
  }, [showBottomToolbar, readOnly, toggleReadOnlyMode]);

  useEffect(() => {
    const nodeIdToFocus = state.editingNodeId || state.selectedNodeId;
    const nodeToFocus = nodeIdToFocus ? findNodeInAST(state.rootNode, nodeIdToFocus) : null;
    if (nodeToFocus && canvasSize) {
        const nodeCenterWorld: Point = { x: nodeToFocus.position.x + nodeToFocus.width / 2, y: nodeToFocus.position.y + nodeToFocus.height / 2 };
        const nodeScreenCenterPos = worldToScreen(nodeCenterWorld, state.viewport);
        const marginX = Math.min(100, canvasSize.width * 0.1);
        const marginY = Math.min(80, canvasSize.height * 0.1);
        let dxPan = 0, dyPan = 0;
        if (nodeScreenCenterPos.x < marginX) dxPan = marginX - nodeScreenCenterPos.x;
        else if (nodeScreenCenterPos.x > canvasSize.width - marginX) dxPan = (canvasSize.width - marginX) - nodeScreenCenterPos.x;
        if (nodeScreenCenterPos.y < marginY) dyPan = marginY - nodeScreenCenterPos.y;
        else if (nodeScreenCenterPos.y > canvasSize.height - marginY) dyPan = (canvasSize.height - marginY) - nodeScreenCenterPos.y;
        if (dxPan !== 0 || dyPan !== 0) pan(dxPan, dyPan);
    }
  }, [state.editingNodeId, state.selectedNodeId, state.rootNode, state.viewport, canvasSize, pan]);

  // 自动居中到当前搜索匹配的节点
  useEffect(() => {
    if (state.currentMatchNodeId && state.rootNode && canvasSize) {
      const nodeToFocus = findNodeInAST(state.rootNode, state.currentMatchNodeId);
      if (nodeToFocus) {
        const nodeCenterWorld: Point = { x: nodeToFocus.position.x + nodeToFocus.width / 2, y: nodeToFocus.position.y + nodeToFocus.height / 2 };
        const newX = (canvasSize.width / 2) - (nodeCenterWorld.x * state.viewport.zoom);
        const newY = (canvasSize.height / 2) - (nodeCenterWorld.y * state.viewport.zoom);
        mindMapHook.setViewport({ x: newX, y: newY });
      }
    }
  }, [state.currentMatchNodeId, state.rootNode, canvasSize, state.viewport.zoom, mindMapHook.setViewport, pan]);

  const zoomPercentage = Math.round(state.viewport.zoom * 100);

  const handleToggleFullscreen = () => {
    const elem = appContainerRef.current;
    if (!elem) return;
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch((err: Error) => console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`));
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  const handlers = {
    addNode: mindMapHook.addNode,
    deleteNode: mindMapHook.deleteNode,
    zoom: mindMapHook.zoom,
    fitView: mindMapHook.fitView,
    toggleFullscreen: handleToggleFullscreen,
    toggleReadOnlyMode: mindMapHook.toggleReadOnlyMode,
    toggleSearch: () => setIsSearchVisible(!isSearchVisible),
  };

  const topToolbarCommands = (topToolbarConfig ?? getDefaultTopToolbarConfig({
    selectedNodeId: state.selectedNodeId,
    isReadOnly: state.isReadOnly,
    isFullscreen: isFullscreen,
  }, handlers)).filter((btn: ToolbarButtonConfig) => btn.visible !== false);
  
  // 包装 setViewport，便于调试
  const safeSetViewport = (viewportUpdate: Partial<typeof state.viewport>) => {
    console.log('setViewport called', viewportUpdate);
    mindMapHook.setViewport(viewportUpdate);
  };

  // 居中按钮专用
  const handleCenterContent = () => {
    const size = canvasSize && canvasSize.width > 0 && canvasSize.height > 0 ? canvasSize : { width: window.innerWidth, height: window.innerHeight };
    
    const nodeToCenterId = state.currentMatchNodeId || state.selectedNodeId;

    if (nodeToCenterId && state.rootNode) {
      const node = findNodeInAST(state.rootNode, nodeToCenterId);
      if (node) {
        const nodeCenter = { x: node.position.x + node.width / 2, y: node.position.y + node.height / 2 };
        const newX = size.width / 2 - nodeCenter.x * state.viewport.zoom;
        const newY = size.height / 2 - nodeCenter.y * state.viewport.zoom;
        safeSetViewport({ x: newX, y: newY });
        return;
      }
    }
    
    // Fallback to fitting the entire view if no specific node is targeted
    mindMapHook.fitView(true);
  };

  const bottomToolbarCommands = (bottomToolbarConfig ?? getDefaultBottomToolbarConfig({
    selectedNodeId: state.selectedNodeId,
    isReadOnly: state.isReadOnly,
    isFullscreen: isFullscreen,
  }, { ...handlers, fitView: mindMapHook.fitView, fitViewCenter: handleCenterContent }, canvasSize)).filter((btn: ToolbarButtonConfig) => btn.visible !== false);
  
  const updateTopHandlePosition = (newPos: { x: number; y: number }) => {
    const newY = Math.max(0, Math.min(newPos.y, bottomHandlePosition.y - 64 - 10));
    setTopHandlePosition({ x: newPos.x, y: newY });
  };

  const updateBottomHandlePosition = (newPos: { x: number; y: number }) => {
    const parentHeight = canvasContainerRef.current?.clientHeight ?? window.innerHeight;
    const newY = Math.min(parentHeight - 64, Math.max(newPos.y, topHandlePosition.y + 64 + 10));
    setBottomHandlePosition({ x: newPos.x, y: newY });
  };

  // 1. 全局快捷键监听，Cmd+F/Ctrl+F 打开/关闭搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).contentEditable === 'true')) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchVisible((v: boolean) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  useEffect(() => {
    toggleReadOnlyMode(readOnly);
  }, [readOnly, toggleReadOnlyMode]);

  // 当搜索框关闭时，自动清空搜索词和结果
  useEffect(() => {
    if (!isSearchVisible) {
      setSearchTerm('');
    }
  }, [isSearchVisible, setSearchTerm]);

  return (
    <div ref={appContainerRef} style={{ width, height }} className="flex flex-col bg-gray-200 overflow-hidden relative select-none">
      {showTopToolbar && (
        <Toolbar 
          commands={topToolbarCommands} 
          handlePosition={topHandlePosition}
          onPositionChange={updateTopHandlePosition}
        />
      )}
      <div ref={canvasContainerRef} className="flex-grow w-full h-full relative overflow-hidden">
        {canvasSize && <MindMapCanvas mindMapHookInstance={mindMapHook} />}
      </div>
      {showBottomToolbar && (
        <BottomViewportToolbar 
          commands={bottomToolbarCommands} 
          zoomPercentage={zoomPercentage}
          handlePosition={bottomHandlePosition}
          onPositionChange={updateBottomHandlePosition}
        />
      )}
      {isSearchVisible && (
        <SearchWidget
          isVisible={isSearchVisible}
          searchTerm={state.currentSearchTerm}
          onSearchTermChange={setSearchTerm}
          onClose={() => setIsSearchVisible(false)}
          totalMatches={state.searchMatches.length}
          currentMatchIndex={state.currentMatchIndex}
          onNextMatch={goToNextMatch}
          onPreviousMatch={goToPreviousMatch}
        />
      )}
    </div>
  );
}
