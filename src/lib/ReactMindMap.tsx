import React, { useState, useRef, useEffect, useMemo } from 'react';
import Toolbar from './components/Toolbar';
import MindMapCanvas from './components/MindMapCanvas';
import BottomViewportToolbar from './components/BottomViewportToolbar';
import SearchWidget from './components/SearchWidget';
import { useMindMap } from './hooks/useMindMap';
import { MindMapNode, Command, Point, ToolbarButtonConfig, MindMapState, DataChangeCallback, MindMapPriorityConfig, LineType } from './types';
import { findNodeInAST } from './utils/nodeUtils';
import { worldToScreen } from './utils/canvasUtils';
import { getDefaultTopToolbarConfig, getDefaultBottomToolbarConfig } from './defaultConfig';
import { FiMaximize, FiMinimize } from 'react-icons/fi';
import Minimap from './components/Minimap';
import { ContextMenuGroup } from './components/ContextMenu';
import Panel from './components/Panel';

// Import all commands
import { undoCommand } from './commands/undoCommand';
import { redoCommand } from './commands/redoCommand';
import { addSiblingNodeCommand } from './commands/addSiblingNodeCommand';
import { addChildNodeCommand } from './commands/addChildNodeCommand';
import { deleteNodeCommand } from './commands/deleteNodeCommand';
import { fitViewCommand } from './commands/fitViewCommand';
import { toggleReadOnlyCommand } from './commands/toggleReadOnlyCommand';
import { zoomInCommand } from './commands/zoomInCommand';
import { zoomOutCommand } from './commands/zoomOutCommand';
import { toggleSearchCommand } from './commands/toggleSearchCommand';
import { centerViewCommand } from './commands/centerViewCommand';
import { toggleFullscreenCommand } from './commands/toggleFullscreenCommand';

// Create a command registry
const commandRegistry: Map<string, Command> = new Map([
  [undoCommand.id, undoCommand],
  [redoCommand.id, redoCommand],
  [addSiblingNodeCommand.id, addSiblingNodeCommand],
  [addChildNodeCommand.id, addChildNodeCommand],
  [deleteNodeCommand.id, deleteNodeCommand],
  [fitViewCommand.id, fitViewCommand],
  [toggleReadOnlyCommand.id, toggleReadOnlyCommand],
  [zoomInCommand.id, zoomInCommand],
  [zoomOutCommand.id, zoomOutCommand],
  [toggleSearchCommand.id, toggleSearchCommand],
  [centerViewCommand.id, centerViewCommand],
  [toggleFullscreenCommand.id, toggleFullscreenCommand],
]);

export interface ReactMindMapProps {
  initialData: MindMapNode;
  width?: string;
  height?: string;
  topToolbarKeys?: string[];
  bottomToolbarKeys?: string[];
  showTopToolbar?: boolean;
  showBottomToolbar?: boolean;
  readOnly?: boolean;
  onDataChange?: (data: MindMapNode) => void;
  /**
   * 数据变更回调函数，提供详细的操作信息
   * @param changeInfo 数据变更信息，包含操作类型、变更的节点、完整数据等
   */
  onDataChangeDetailed?: DataChangeCallback;
  /**
   * 顶部工具条自定义按钮（追加到末尾）
   */
  topToolbarCustomButtons?: ToolbarButtonConfig[];
  /**
   * 底部工具条自定义按钮（追加到末尾）
   */
  bottomToolbarCustomButtons?: ToolbarButtonConfig[];
  getNodeStyle: (node: MindMapNode) => React.CSSProperties;
  /**
   * 画布背景色，默认 #f9fafb
   */
  canvasBackgroundColor?: string;
  /**
   * 是否显示点状背景，类似 reactflow，默认 false
   */
  showDotBackground?: boolean;
  /**
   * 是否显示右下角 Minimap 缩略图，默认 true
   */
  showMinimap?: boolean;
  /**
   * 是否启用右键上下文菜单，默认 true
   */
  enableContextMenu?: boolean;
  /**
   * 自定义右键菜单内容生成函数
   * @param node 当前右键的节点对象（可能为 null，表示空白处）
   * @param state 当前思维导图状态
   * @returns ContextMenuGroup[] 菜单分组
   */
  getContextMenuGroups?: (node: MindMapNode | null, state: MindMapState) => ContextMenuGroup[];
  typeConfig: any;
  priorityConfig?: MindMapPriorityConfig;
  lineType?: LineType;
  showArrow?: boolean;
}

export default function ReactMindMap({
  initialData,
  width = '100vw',
  height = '100vh',
  topToolbarKeys,
  bottomToolbarKeys,
  showTopToolbar = true,
  showBottomToolbar = true,
  readOnly = true,
  onDataChange,
  onDataChangeDetailed,
  topToolbarCustomButtons,
  bottomToolbarCustomButtons,
  getNodeStyle,
  canvasBackgroundColor = '#f9fafb',
  showDotBackground = false,
  showMinimap = true,
  enableContextMenu = true,
  getContextMenuGroups,
  typeConfig,
  priorityConfig = { enabled: false },
  lineType = 'polyline',
  showArrow = false,
}: ReactMindMapProps) {
  const appContainerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  const mindMapHook = useMindMap(canvasSize, initialData, onDataChangeDetailed, onDataChange, typeConfig, priorityConfig);
  const { 
    state, 
    pan, 
    toggleReadOnlyMode, 
    goToNextMatch, 
    goToPreviousMatch, 
    setSearchTerm, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    addNode,
    deleteNode,
    fitView,
    zoomIn,
    zoomOut,
    centerView,
  } = mindMapHook;

  const [topHandlePosition, setTopHandlePosition] = useState({ x: 0, y: 0 });
  const [bottomHandlePosition, setBottomHandlePosition] = useState({ x: 0, y: 0 });
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 新增：拖动状态全局标志
  const isDraggingNodeRef = useRef(false);

  // 传递给 MindMapCanvas，让其在拖动时设置 isDraggingNodeRef
  const handleDraggingChange = (dragging: boolean) => {
    isDraggingNodeRef.current = dragging;
  };

  // 拖动期间阻断自动居中，拖动结束后立即恢复
  const autoCenterBlockedRef = useRef(false);
  useEffect(() => {
    if (isDraggingNodeRef.current) {
      autoCenterBlockedRef.current = true;
      return;
    }
    // 拖动结束后立即恢复
    if (autoCenterBlockedRef.current) {
      autoCenterBlockedRef.current = false;
    }
    // 只在 selectedNodeId/editingNodeId 变化时自动居中
    if (autoCenterBlockedRef.current) return;
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
    // eslint-disable-next-line
  }, [state.editingNodeId, state.selectedNodeId, state.rootNode, canvasSize]);

  // 在组件顶部添加
  const lastCenteredMatchId = useRef<string | null>(null);

  // 替换原自动居中 useEffect
  useEffect(() => {
    if (
      state.currentMatchNodeId &&
      state.rootNode &&
      canvasSize &&
      lastCenteredMatchId.current !== state.currentMatchNodeId
    ) {
      const nodeToFocus = findNodeInAST(state.rootNode, state.currentMatchNodeId);
      if (nodeToFocus) {
        const nodeCenterWorld: Point = { x: nodeToFocus.position.x + nodeToFocus.width / 2, y: nodeToFocus.position.y + nodeToFocus.height / 2 };
        const newX = (canvasSize.width / 2) - (nodeCenterWorld.x * state.viewport.zoom);
        const newY = (canvasSize.height / 2) - (nodeCenterWorld.y * state.viewport.zoom);
        mindMapHook.setViewport({ x: newX, y: newY });
        lastCenteredMatchId.current = state.currentMatchNodeId; // 标记已居中
      }
    }
    // 当搜索词清空时，重置标志
    if (!state.currentMatchNodeId) {
      lastCenteredMatchId.current = null;
    }
  }, [state.currentMatchNodeId, state.rootNode, canvasSize, state.viewport.zoom, mindMapHook.setViewport]);

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
    addNode,
    deleteNode,
    fitView,
    toggleReadOnlyMode,
    undo,
    redo,
    zoomIn,
    zoomOut,
    toggleSearch: () => setIsSearchVisible(!isSearchVisible),
    centerView,
    toggleFullscreen: handleToggleFullscreen,
  };
  
  const topToolbarConfig = topToolbarKeys ?? getDefaultTopToolbarConfig();
  const bottomToolbarConfig = bottomToolbarKeys ?? getDefaultBottomToolbarConfig();

  const buildToolbarCommands = (commandIds: string[]): ToolbarButtonConfig[] => {
    return commandIds.map(id => {
      const command = commandRegistry.get(id);
      if (!command) {
        console.warn(`Command with id "${id}" not found in registry.`);
        return null;
      }
      let disabled = false;
      let extraArgs: any[] = [];
      if (id === 'undo') extraArgs = [canUndo];
      if (id === 'redo') extraArgs = [canRedo];
      disabled = !command.canExecute(state, ...extraArgs);
      const button: ToolbarButtonConfig = {
        id: command.id,
        label: command.label,
        title: command.title,
        icon: command.icon as React.ComponentType,
        action: () => command.execute(state, handlers),
        disabled: disabled,
      };
      if (command.getDynamicProps) {
        const dynamicProps = command.getDynamicProps(state);
        Object.assign(button, dynamicProps);
      }
      if (command.id === 'toggle-fullscreen') {
        button.icon = isFullscreen ? FiMinimize : FiMaximize;
        button.title = isFullscreen ? '退出全屏' : '进入全屏';
      }
      return button;
    }).filter((c): c is ToolbarButtonConfig => c !== null);
  };
  
  const mergeCustomButtons = (built: ToolbarButtonConfig[], custom?: ToolbarButtonConfig[]) => {
    if (!custom) return built;
    return [
      ...built,
      ...custom.map(btn => {
        if (typeof btn.disabled === 'function') {
          return { ...btn, disabled: (btn.disabled as (state: MindMapState) => boolean)(state) };
        }
        return btn;
      })
    ];
  };

  const topToolbarCommands = useMemo(
    () => mergeCustomButtons(buildToolbarCommands(topToolbarConfig), topToolbarCustomButtons),
    [state, topToolbarConfig, canUndo, canRedo, handlers, topToolbarCustomButtons]
  );
  const bottomToolbarCommands = useMemo(
    () => mergeCustomButtons(buildToolbarCommands(bottomToolbarConfig), bottomToolbarCustomButtons),
    [state, bottomToolbarConfig, handlers, bottomToolbarCustomButtons]
  );
  
  const updateTopHandlePosition = (newPos: { x: number; y: number }) => {
    const newY = Math.max(0, Math.min(newPos.y, bottomHandlePosition.y - 64 - 10));
    setTopHandlePosition({ x: newPos.x, y: newY });
  };

  const updateBottomHandlePosition = (newPos: { x: number; y: number }) => {
    const parentHeight = canvasContainerRef.current?.clientHeight ?? window.innerHeight;
    const newY = Math.min(parentHeight - 64, Math.max(newPos.y, topHandlePosition.y + 64 + 10));
    setBottomHandlePosition({ x: newPos.x, y: newY });
  };

  // Global hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isBodyActive = activeEl === document.body;
      const isCanvasActive = canvasContainerRef.current?.contains(activeEl);

      if (!isBodyActive && !isCanvasActive) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const undoKeyPressed = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey;
      const redoKeyPressed = (isMac ? e.metaKey && e.shiftKey && e.key.toLowerCase() === 'z' : e.ctrlKey && e.key.toLowerCase() === 'y');

      if (undoKeyPressed) {
        e.preventDefault();
        const cmd = commandRegistry.get('undo');
        if (cmd && cmd.canExecute(state, canUndo)) cmd.execute(state, handlers);
      } else if (redoKeyPressed) {
        e.preventDefault();
        const cmd = commandRegistry.get('redo');
        if (cmd && cmd.canExecute(state, canRedo)) cmd.execute(state, handlers);
      } else if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchVisible((v: boolean) => !v);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, canUndo, canRedo, handlers]);

  // 搜索框关闭时清空搜索词，依赖只写 isSearchVisible，避免 setSearchTerm 引用变化导致死循环
  useEffect(() => {
    if (!isSearchVisible) {
      setSearchTerm('');
    }
  }, [isSearchVisible]);

  // 全局监听上下键，搜索面板可见时响应
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

  return (
    <div
      ref={appContainerRef}
      style={{ width, height, position: 'relative', background: canvasBackgroundColor }}
      className="react-mindmap-app-container"
    >
      {showTopToolbar && (
        <Toolbar 
          commands={topToolbarCommands} 
          handlePosition={topHandlePosition}
          onPositionChange={updateTopHandlePosition}
        />
      )}
      <div ref={canvasContainerRef} style={{ width: '100%', height: '100%' }}>
        <MindMapCanvas
          mindMapHookInstance={mindMapHook}
          getNodeStyle={getNodeStyle}
          canvasBackgroundColor={canvasBackgroundColor}
          showDotBackground={showDotBackground}
          enableContextMenu={enableContextMenu}
          getContextMenuGroups={getContextMenuGroups}
          onDraggingChange={handleDraggingChange}
          priorityConfig={priorityConfig}
          lineType={lineType}
          showArrow={showArrow}
        />
        {showMinimap && state.rootNode && canvasSize && (
          <Minimap
            rootNode={state.rootNode}
            viewport={state.viewport}
            canvasSize={canvasSize}
            onViewportChange={mindMapHook.setViewport}
            getNodeStyle={getNodeStyle}
          />
        )}
      </div>
      {showBottomToolbar && (
        <BottomViewportToolbar 
          commands={bottomToolbarCommands} 
          zoomPercentage={zoomPercentage}
          handlePosition={bottomHandlePosition}
          onPositionChange={updateBottomHandlePosition}
          state={state}
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

export { Panel };


