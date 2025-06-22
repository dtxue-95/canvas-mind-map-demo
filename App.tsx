import React, { useState, useEffect, useRef, useMemo } from 'react';
import '@alifd/next/dist/next.min.css';
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

function App() {
  const [canvasSize, setCanvasSize] = useState<{width: number, height: number} | null>(null);
  const mindMapHook = useMindMap(canvasSize);
  const { state, dispatch, addNode, deleteNode, zoom, setViewport, setSearchTerm, toggleReadOnlyMode } = mindMapHook;
  
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const appContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [isSearchVisible, setIsSearchVisible] = useState(false);

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
        title: state.isReadOnly ? '只读模式' : '添加新的兄弟节点（如果没有选中/选中根节点则添加根节点）（Insert 或 Shift+Tab）',
      },
      {
        id: 'add-child',
        label: '添加子节点',
        action: () => handleAddNodeCommand(true),
        disabled: !canAddChild || state.isReadOnly,
        title: state.isReadOnly ? '只读模式' : (canAddChild ? "为选中节点添加子节点（Tab）" : "选择一个节点来添加子节点"),
      },
      {
        id: 'delete-node',
        label: '删除节点',
        action: handleDeleteNodeCommand,
        disabled: !canDeleteCurrentNode || state.isReadOnly,
        title: state.isReadOnly ? '只读模式' : (canDeleteCurrentNode ? "删除选中节点及其子节点（Delete/Backspace）" : "选择一个节点来删除，或无法删除最后一个节点"),
      },
    ];
  }, [state.selectedNodeId, state.rootNode, state.isReadOnly, addNode, deleteNode]);
  
  // 放大处理函数
  const handleZoomInApp = () => {
    if (canvasSize) {
      zoom(-150, { x: canvasSize.width / 2, y: canvasSize.height / 2 });
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
    // 确定居中的目标节点：如果有选中节点则居中选中节点，否则居中根节点
    const targetNode = state.selectedNodeId 
      ? findNodeInAST(state.rootNode, state.selectedNodeId) 
      : state.rootNode;
    
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

  const zoomPercentage = Math.round(state.viewport.zoom * 100);
  const nodeToEditForInput = state.editingNodeId ? findNodeInAST(state.rootNode, state.editingNodeId) : null;

  return (
    <div ref={appContainerRef} className="w-screen h-screen flex flex-col bg-gray-200 overflow-hidden">
      <Toolbar commands={topToolbarCommands} borderStyle="bottom" />
      <div ref={canvasContainerRef} className="flex-grow w-full h-full relative overflow-hidden">
        {canvasSize && <MindMapCanvas mindMapHookInstance={mindMapHook} />}
      </div>
      <BottomViewportToolbar
        zoomPercentage={zoomPercentage}
        isFullscreen={isFullscreen}
        isReadOnly={state.isReadOnly}
        onZoomIn={handleZoomInApp}
        onZoomOut={handleZoomOutApp}
        onCenterView={handleCenterContent}
        onFitView={handleFitView}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleSearchWidget={handleToggleSearchWidget}
        onToggleReadOnly={mindMapHook.toggleReadOnlyMode} // 直接从 hook 传递
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
