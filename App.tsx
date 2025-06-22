import React, { useState, useEffect, useRef, useMemo } from 'react';
import Toolbar from './components/Toolbar';
import MindMapCanvas from './components/MindMapCanvas'; // 修正为 .tsx
import BottomViewportToolbar from './components/BottomViewportToolbar';
import SearchWidget from './components/SearchWidget';
import NodeEditInput from './components/NodeEditInput'; // 添加 NodeEditInput 导入
import { useMindMap } from './hooks/useMindMap';
import { CommandDescriptor, MindMapNodeAST, Point } from './types'; // 添加 MindMapNodeAST
import { NEW_NODE_TEXT, INITIAL_ZOOM } from './constants';
import { findNodeInAST, findNodeAndParentInAST } from './utils/nodeUtils'; // 添加 AST 查找器
import { worldToScreen } from './utils/canvasUtils'; // 用于自动平移
import { 
  FaPlus, FaMinus, FaTrash, FaSitemap, FaSearch, FaExpandArrowsAlt, 
  FaCompressArrowsAlt, FaLock, FaUnlock, FaCrosshairs, FaVectorSquare
} from 'react-icons/fa';

const HANDLE_WIDTH = 32; // px
const HANDLE_HEIGHT = 64; // px
const HANDLE_VERTICAL_PADDING = 10; // px

function App() {
  const [canvasSize, setCanvasSize] = useState<{width: number, height: number} | null>(null);
  const mindMapHook = useMindMap(canvasSize);
  const { state, dispatch, addNode, deleteNode, zoom, setViewport, setSearchTerm, toggleReadOnlyMode } = mindMapHook;
  
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const appContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  
  // 统一管理工具栏拉手位置
  const [topHandlePosition, setTopHandlePosition] = useState({ 
    x: window.innerWidth - HANDLE_WIDTH, 
    y: window.innerHeight * 0.25 
  });
  const [bottomHandlePosition, setBottomHandlePosition] = useState({ 
    x: window.innerWidth - HANDLE_WIDTH, 
    y: window.innerHeight * 0.75 
  });

  // 更新顶部拉手位置并防止重叠
  const updateTopHandlePosition = (newPos: { x: number; y: number }) => {
    const newY = Math.max(
      0, 
      Math.min(newPos.y, bottomHandlePosition.y - HANDLE_HEIGHT - HANDLE_VERTICAL_PADDING)
    );
    setTopHandlePosition({ x: newPos.x, y: newY });
  };

  // 更新底部拉手位置并防止重叠
  const updateBottomHandlePosition = (newPos: { x: number; y: number }) => {
    const newY = Math.min(
      window.innerHeight - HANDLE_HEIGHT, 
      Math.max(newPos.y, topHandlePosition.y + HANDLE_HEIGHT + HANDLE_VERTICAL_PADDING)
    );
    setBottomHandlePosition({ x: newPos.x, y: newY });
  };

  // 监听画布尺寸变化
  useEffect(() => {
    const updateSize = () => {
      if (canvasContainerRef.current) {
        setCanvasSize({
          width: canvasContainerRef.current.clientWidth,
          height: canvasContainerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 自动平移效果 - 使用 findNodeInAST
  useEffect(() => {
    const nodeIdToFocus = state.editingNodeId || state.selectedNodeId;
    const nodeToFocus = nodeIdToFocus ? findNodeInAST(state.rootNode, nodeIdToFocus) : null;

    if (nodeToFocus && canvasSize && canvasSize.width > 0 && canvasSize.height > 0) {
      // 计算节点中心用于聚焦，而不是仅仅其左上角位置
      const nodeCenterWorld: Point = {
        x: nodeToFocus.position.x + nodeToFocus.width / 2,
        y: nodeToFocus.position.y + nodeToFocus.height / 2,
      };
      const nodeScreenCenterPos = worldToScreen(nodeCenterWorld, state.viewport);
      
      const nodeScreenWidth = nodeToFocus.width * state.viewport.zoom;
      const nodeScreenHeight = nodeToFocus.height * state.viewport.zoom;
      
      // 计算节点的可见边界
      const nodeScreenLeft = nodeScreenCenterPos.x - nodeScreenWidth / 2;
      const nodeScreenRight = nodeScreenCenterPos.x + nodeScreenWidth / 2;
      const nodeScreenTop = nodeScreenCenterPos.y - nodeScreenHeight / 2;
      const nodeScreenBottom = nodeScreenCenterPos.y + nodeScreenHeight / 2;

      const marginX = Math.min(100, canvasSize.width * 0.1); // 动态边距
      const marginY = Math.min(80, canvasSize.height * 0.1); // 动态边距

      let dxPan = 0;
      let dyPan = 0;

      if (nodeScreenRight > canvasSize.width - marginX) {
        dxPan = (canvasSize.width - marginX) - nodeScreenRight;
      } else if (nodeScreenLeft < marginX) {
        dxPan = marginX - nodeScreenLeft;
      }

      if (nodeScreenBottom > canvasSize.height - marginY) {
        dyPan = (canvasSize.height - marginY) - nodeScreenBottom;
      } else if (nodeScreenTop < marginY) {
        dyPan = marginY - nodeScreenTop;
      }
      
      if (dxPan !== 0 || dyPan !== 0) {
        mindMapHook.pan(dxPan, dyPan);
      }
    }
  }, [state.editingNodeId, state.selectedNodeId, state.rootNode, state.viewport, canvasSize, mindMapHook.pan]);

  // 监听搜索状态变化，当有匹配的节点时自动居中
  useEffect(() => {
    // 当有搜索匹配时，自动居中到第一个匹配的节点
    if (state.highlightedNodeIds.size > 0 && canvasSize) {
      // 找到第一个匹配的节点
      let firstMatchNode: MindMapNodeAST | null = null;
      
      function findFirstMatchNode(node: MindMapNodeAST | null): MindMapNodeAST | null {
        if (!node) return null;
        
        // 检查当前节点是否匹配
        if (state.highlightedNodeIds.has(node.id)) {
          return node;
        }
        
        // 递归检查子节点
        if (!node.isCollapsed) {
          for (const child of node.children) {
            const found = findFirstMatchNode(child);
            if (found) return found;
          }
        }
        
        return null;
      }
      
      firstMatchNode = findFirstMatchNode(state.rootNode);
      
      if (firstMatchNode) {
        const targetWorldX = firstMatchNode.position.x + firstMatchNode.width / 2;
        const targetWorldY = firstMatchNode.position.y + firstMatchNode.height / 2;

        // 使用当前缩放比例将视图居中到目标节点
        const newViewportX = (canvasSize.width / 2) - (targetWorldX * state.viewport.zoom);
        const newViewportY = (canvasSize.height / 2) - (targetWorldY * state.viewport.zoom);
        setViewport({ x: newViewportX, y: newViewportY });
      }
    }
  }, [state.highlightedNodeIds.size, state.rootNode, canvasSize, state.viewport.zoom, setViewport]);

  // 顶部工具栏命令配置
  const topToolbarCommands = useMemo<CommandDescriptor[]>(() => {
    const canAddChild = !!state.selectedNodeId;
    let canDeleteCurrentNode = !!state.selectedNodeId;
    
    // 检查选中的节点是否是绝对最后一个节点
    if (state.rootNode && state.selectedNodeId === state.rootNode.id) {
        let nodeCount = 0;
        const countNodesRecursive = (node: MindMapNodeAST | null) => {
            if (!node) return;
            nodeCount++;
            node.children.forEach(countNodesRecursive);
        };
        countNodesRecursive(state.rootNode);
        if (nodeCount <= 1) {
            canDeleteCurrentNode = false;
        }
    }

    const handleAddNodeCommand = (isChild: boolean) => {
      if (isChild && state.selectedNodeId) {
        addNode(NEW_NODE_TEXT, state.selectedNodeId);
      } else { // 添加兄弟节点或新根节点
        let parentIdForSibling: string | null = null;
        if (state.selectedNodeId && state.rootNode) {
            const parentInfo = findNodeAndParentInAST(state.rootNode, state.selectedNodeId);
            if(parentInfo && parentInfo.parent) {
                parentIdForSibling = parentInfo.parent.id;
            } 
            // 如果选中节点是根节点，parentIdForSibling 保持为 null（如果允许则添加另一个根节点，或由命令处理）
        }
        addNode(NEW_NODE_TEXT, parentIdForSibling);
      }
    };

    const handleDeleteNodeCommand = () => {
      if (state.selectedNodeId) {
         // 在删除前重新检查最后一个节点，因为 canDeleteCurrentNode 可能稍微不同步
         // 或者为了额外的安全层
         if (state.rootNode && state.selectedNodeId === state.rootNode.id) {
            let nodeCount = 0;
            const countNodes = (node: MindMapNodeAST | null) => {
                if (!node) return;
                nodeCount++;
                node.children.forEach(countNodes);
            };
            countNodes(state.rootNode);
            if (nodeCount <= 1) {
                alert("无法删除最后一个节点。");
                return;
            }
        }
        deleteNode(state.selectedNodeId);
      }
    };

    return [
      {
        id: 'add-node',
        label: '添加节点',
        action: () => handleAddNodeCommand(false),
        disabled: state.isReadOnly,
        title: state.isReadOnly ? '只读模式' : '添加兄弟节点 (Insert)',
        icon: FaPlus,
      },
      {
        id: 'add-child',
        label: '添加子节点',
        action: () => handleAddNodeCommand(true),
        disabled: !canAddChild || state.isReadOnly,
        title: state.isReadOnly ? '只读模式' : (canAddChild ? "添加子节点 (Tab)" : "请先选择一个节点"),
        icon: FaSitemap,
      },
      {
        id: 'delete-node',
        label: '删除节点',
        action: handleDeleteNodeCommand,
        disabled: !canDeleteCurrentNode || state.isReadOnly,
        title: state.isReadOnly ? '只读模式' : (canDeleteCurrentNode ? "删除节点 (Delete)" : "无法删除最后一个节点"),
        icon: FaTrash,
      },
    ];
  }, [state.selectedNodeId, state.rootNode, state.isReadOnly, addNode, deleteNode]);

  // 放大处理函数
  const handleZoomInApp = () => {
    if (canvasSize) {
      zoom(-100, { x: canvasSize.width / 2, y: canvasSize.height / 2 });
    }
  };

  // 缩小处理函数
  const handleZoomOutApp = () => {
    if (canvasSize) {
      zoom(150, { x: canvasSize.width / 2, y: canvasSize.height / 2 });
    }
  };

  // 居中内容处理函数
  const handleCenterContent = () => {
    // 确定居中的目标节点：
    // 1. 如果有搜索匹配，优先居中到第一个匹配的节点
    // 2. 如果有选中节点，居中选中节点
    // 3. 否则居中根节点
    let targetNode: MindMapNodeAST | null = null;
    
    if (state.highlightedNodeIds.size > 0) {
      // 找到第一个匹配的节点
      function findFirstMatchNode(node: MindMapNodeAST | null): MindMapNodeAST | null {
        if (!node) return null;
        
        if (state.highlightedNodeIds.has(node.id)) {
          return node;
        }
        
        if (!node.isCollapsed) {
          for (const child of node.children) {
            const found = findFirstMatchNode(child);
            if (found) return found;
          }
        }
        
        return null;
      }
      
      targetNode = findFirstMatchNode(state.rootNode);
    }
    
    // 如果没有匹配的节点，使用选中的节点或根节点
    if (!targetNode) {
      targetNode = state.selectedNodeId 
        ? findNodeInAST(state.rootNode, state.selectedNodeId) 
        : state.rootNode;
    }
    
    if (targetNode && canvasSize) {
      const targetWorldX = targetNode.position.x + targetNode.width / 2;
      const targetWorldY = targetNode.position.y + targetNode.height / 2;

      // 使用当前缩放比例将视图居中到目标节点
      const newViewportX = (canvasSize.width / 2) - (targetWorldX * state.viewport.zoom);
      const newViewportY = (canvasSize.height / 2) - (targetWorldY * state.viewport.zoom);
      setViewport({ x: newViewportX, y: newViewportY });
    }
  };

  // 适应视图处理函数
  const handleFitView = () => {
    if (!state.rootNode || !canvasSize || canvasSize.width === 0 || canvasSize.height === 0) {
      handleCenterContent(); // 如果没有根节点或画布尺寸，回退到居中
      return;
    }

    // 首先，确保布局是最新的
    dispatch({ type: 'APPLY_LAYOUT_FROM_ROOT' });

    // 使用超时来允许布局应用和状态更新，然后再计算边界
    setTimeout(() => {
        const currentRootNode = mindMapHook.state.rootNode; // 获取可能重新布局的根节点
        if (!currentRootNode) {
            handleCenterContent(); return;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        function getBoundsRecursive(node: MindMapNodeAST) {
            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxX = Math.max(maxX, node.position.x + node.width);
            maxY = Math.max(maxY, node.position.y + node.height);
            if (!node.isCollapsed) {
                node.children.forEach(getBoundsRecursive);
            }
        }
        getBoundsRecursive(currentRootNode);

        if (minX === Infinity) { // 没有节点或只有一个节点，回退到居中
            handleCenterContent(); return;
        }

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        if (contentWidth === 0 || contentHeight === 0) {
            handleCenterContent(); return; // 避免除零
        }
        
        const padding = 50; // 内容周围的像素内边距
        const availableWidth = canvasSize.width - 2 * padding;
        const availableHeight = canvasSize.height - 2 * padding;

        const zoomX = availableWidth / contentWidth;
        const zoomY = availableHeight / contentHeight;
        const newZoom = Math.max(INITIAL_ZOOM * 0.25, Math.min(INITIAL_ZOOM * 2, zoomX, zoomY)); // 限制缩放

        const contentCenterX = minX + contentWidth / 2;
        const contentCenterY = minY + contentHeight / 2;

        const newViewportX = (canvasSize.width / 2) - (contentCenterX * newZoom);
        const newViewportY = (canvasSize.height / 2) - (contentCenterY * newZoom);

        setViewport({ x: newViewportX, y: newViewportY, zoom: newZoom });
    }, 50); // 布局传播的小延迟
  };

  // 切换全屏处理函数
  const handleToggleFullscreen = () => {
    const element = appContainerRef.current;
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.error(`尝试启用全屏模式时出错: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // 切换搜索组件显示
  const handleToggleSearchWidget = () => {
    setIsSearchVisible(prev => {
      const newVisible = !prev;
      // 如果关闭搜索框，清空搜索内容
      if (!newVisible) {
        setSearchTerm("");
      }
      return newVisible;
    });
  };

  // 搜索词变化处理
  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
  };
  
  // 关闭搜索处理
  const handleCloseSearch = () => {
    setIsSearchVisible(false);
    setSearchTerm("");
  };

  // 底部工具栏命令配置
  const bottomToolbarCommands = useMemo<CommandDescriptor[]>(() => {
    return [
      {
        id: 'search',
        label: '搜索',
        action: handleToggleSearchWidget,
        disabled: false,
        title: '搜索节点 (Cmd+F)',
        icon: FaSearch,
      },
      {
        id: 'zoom-out',
        label: '缩小',
        action: handleZoomOutApp,
        disabled: false,
        title: '缩小视图 (-)',
        icon: FaMinus,
      },
      {
        id: 'zoom-in',
        label: '放大',
        action: handleZoomInApp,
        disabled: false,
        title: '放大视图 (+)',
        icon: FaPlus,
      },
      {
        id: 'center',
        label: '居中',
        action: handleCenterContent,
        disabled: false,
        title: '居中视图',
        icon: FaCrosshairs,
      },
      {
        id: 'fit-view',
        label: '适应',
        action: handleFitView,
        disabled: false,
        title: '适应视图',
        icon: FaVectorSquare,
      },
      {
        id: 'read-only',
        label: state.isReadOnly ? '只读' : '编辑',
        action: mindMapHook.toggleReadOnlyMode,
        disabled: false,
        title: state.isReadOnly ? '切换到编辑模式' : '切换到只读模式',
        icon: state.isReadOnly ? FaLock : FaUnlock,
      },
      {
        id: 'fullscreen',
        label: isFullscreen ? '退出' : '全屏',
        action: handleToggleFullscreen,
        disabled: false,
        title: isFullscreen ? '退出全屏' : '进入全屏',
        icon: isFullscreen ? FaCompressArrowsAlt : FaExpandArrowsAlt,
      },
    ];
  }, [
    state.isReadOnly, 
    isFullscreen, 
    handleToggleSearchWidget, 
    handleZoomOutApp, 
    handleZoomInApp, 
    handleCenterContent, 
    handleFitView, 
    handleToggleFullscreen, 
    mindMapHook.toggleReadOnlyMode
  ]);

  // 新增: 专门处理全局快捷键，如搜索
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 处理所有可能的搜索快捷键组合 - 无论焦点在哪里都要阻止浏览器搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault(); // 阻止浏览器默认的查找功能
        e.stopPropagation(); // 阻止事件冒泡
        
        // 检查焦点是否在输入框上
        const activeElement = document.activeElement;
        if (activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' || 
          (activeElement as HTMLElement).contentEditable === 'true'
        )) {
          // 如果在输入框内，不触发应用内搜索，只阻止浏览器搜索
          return false;
        }
        
        // 如果不在输入框内，触发应用内搜索
        handleToggleSearchWidget();
        return false; // 确保事件被完全阻止
      }
      
      // 处理其他可能的搜索快捷键（如 Cmd+G 在 Safari 中）
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // 处理 F3 键（某些浏览器的查找下一个）
      if (e.key === 'F3') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 禁用右键菜单中的搜索选项
    const handleContextMenu = (e: MouseEvent) => {
      // 检查是否在搜索相关的元素上右键
      const target = e.target as HTMLElement;
      if (target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' ||
        target.closest('.search-widget') // 如果搜索组件有特定类名
      )) {
        return; // 允许在输入框上显示默认右键菜单
      }
      
      // 在其他地方右键时，阻止默认菜单（包含搜索选项）
      e.preventDefault();
    };

    // 使用 capture 阶段来确保我们的监听器最先执行
    window.addEventListener('keydown', handleGlobalKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
    // 依赖项包含了切换搜索框的函数，确保总是使用最新的函数引用
  }, [handleToggleSearchWidget]);

  const zoomPercentage = Math.round(state.viewport.zoom * 100);
  const nodeToEditForInput = state.editingNodeId ? findNodeInAST(state.rootNode, state.editingNodeId) : null;

  return (
    <div ref={appContainerRef} className="w-screen h-screen flex flex-col bg-gray-200 overflow-hidden">
      <Toolbar 
        commands={topToolbarCommands} 
        handlePosition={topHandlePosition}
        onPositionChange={updateTopHandlePosition}
      />
      <div ref={canvasContainerRef} className="flex-grow w-full h-full relative overflow-hidden">
        {canvasSize && <MindMapCanvas mindMapHookInstance={mindMapHook} />}
      </div>
      <BottomViewportToolbar 
        commands={bottomToolbarCommands} 
        zoomPercentage={zoomPercentage}
        handlePosition={bottomHandlePosition}
        onPositionChange={updateBottomHandlePosition}
      />
      <SearchWidget
        isVisible={isSearchVisible}
        searchTerm={state.currentSearchTerm}
        onSearchTermChange={handleSearchTermChange}
        onClose={handleCloseSearch}
      />
      {/* NodeEditInput 在这里渲染，在画布外部，确保它在所有内容之上并正确处理 DOM 事件 */}
      {nodeToEditForInput && canvasContainerRef.current && !state.isReadOnly && (
         <NodeEditInput
            node={nodeToEditForInput}
            viewport={state.viewport}
            onSave={(text) => {
                mindMapHook.updateNodeText(nodeToEditForInput.id, text);
                mindMapHook.setEditingNode(null); // 确保保存时停止编辑
            }}
            onCancel={() => mindMapHook.setEditingNode(null)}
            canvasBounds={canvasContainerRef.current?.getBoundingClientRect() || null}
        />
      )}
    </div>
  );
}

export default App;
