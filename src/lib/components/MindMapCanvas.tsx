import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useMindMap } from '../hooks/useMindMap';
import { MindMapNode, Point, Viewport, MindMapState } from '../types'; // Changed Node to MindMapNode
import { 
    drawNode, drawConnection, isPointInNode, screenToWorld, drawCollapseButton 
} from '../utils/canvasUtils';
import { CANVAS_BACKGROUND_COLOR, DRAG_THRESHOLD, NEW_NODE_TEXT, COLLAPSE_BUTTON_RADIUS } from '../constants';
import NodeEditInput from './NodeEditInput';
import { findNodeInAST, findNodeAndParentInAST } from '../utils/nodeUtils';
import ContextMenu, { ContextMenuGroup } from './ContextMenu';
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp, FaExpand, FaCompress } from 'react-icons/fa';
import { FiCrosshair, FiBox } from 'react-icons/fi';
import { addChildNodeCommand } from '../commands/addChildNodeCommand';
import { addSiblingNodeCommand } from '../commands/addSiblingNodeCommand';
import { deleteNodeCommand } from '../commands/deleteNodeCommand';
import { fitViewCommand } from '../commands/fitViewCommand';
import { centerViewCommand } from '../commands/centerViewCommand';
import { expandAllCommand } from '../commands/expandAllCommand';
import { collapseAllCommand } from '../commands/collapseAllCommand';



interface MindMapCanvasProps {
  mindMapHookInstance: ReturnType<typeof useMindMap>;
  /**
   * 获取节点自定义样式的回调。可用于动态设置每个节点的 style。
   */
  getNodeStyle?: (node: MindMapNode, state: any) => React.CSSProperties;
  /**
   * 画布背景色，默认 #f9fafb
   */
  canvasBackgroundColor?: string;
  /**
   * 是否显示点状背景，类似 reactflow
   */
  showDotBackground?: boolean;
  /**
   * 是否启用右键菜单，默认 true
   */
  enableContextMenu?: boolean;
  /**
   * 自定义右键菜单内容生成函数
   */
  getContextMenuGroups?: (node: MindMapNode | null, state: MindMapState) => ContextMenuGroup[];
}

// Helper function to find the node at a given point in the AST
// Traverses children first to simulate "topmost" node selection if overlap (drawing order dependent)
function findNodeInASTFromPoint(
    targetNode: MindMapNode | null,
    worldPoint: Point,
    viewport: Viewport // Needed for isPointInNode if it relies on screen space, but isPointInNode uses world
): MindMapNode | null {
    if (!targetNode) return null;

    // Check children first (reverse order for "topmost" if drawn last)
    if (targetNode.children && !targetNode.isCollapsed) { // Only check children if not collapsed
        for (let i = targetNode.children.length - 1; i >= 0; i--) {
            const foundInChild = findNodeInASTFromPoint(targetNode.children[i], worldPoint, viewport);
            if (foundInChild) return foundInChild;
        }
    }
    // Check current node
    if (isPointInNode(worldPoint, targetNode)) {
        return targetNode;
    }
    return null;
}



const MindMapCanvas: React.FC<MindMapCanvasProps> = ({ mindMapHookInstance, getNodeStyle, canvasBackgroundColor, showDotBackground, enableContextMenu = true, getContextMenuGroups }) => {
  const {
    state, setSelectedNode, setEditingNode, zoom, pan,
    updateNodeText, addNode: mindMapAddNode, deleteNode: mindMapDeleteNode,
    toggleNodeCollapse
  } = mindMapHookInstance;
  const {
    rootNode, // Changed from nodes and rootId
    selectedNodeId, editingNodeId, viewport,
    currentSearchTerm, highlightedNodeIds, currentMatchNodeId, isReadOnly
  } = state;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [dragStartNodePosition, setDragStartNodePosition] = useState<Point | null>(null);
  const [lastMousePosition, setLastMousePosition] = useState<Point | null>(null);

  const [currentCanvasSize, setCurrentCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [canvasBounds, setCanvasBounds] = useState<DOMRect | null>(null);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; node: MindMapNode | null }>({ visible: false, x: 0, y: 0, node: null });


  const getMenuCommandState = (nodeId: string) => ({
    ...state,
    selectedNodeId: nodeId
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      setCanvasBounds(canvas.getBoundingClientRect());
    }
  }, [currentCanvasSize]);


  useEffect(() => {
    const handleResize = () => {
      const parent = canvasRef.current?.parentElement;
      if (parent) {
        setCurrentCanvasSize({ width: parent.clientWidth, height: parent.clientHeight });
        if (canvasRef.current) setCanvasBounds(canvasRef.current.getBoundingClientRect());
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const drawBranchRecursive = useCallback((
    ctx: CanvasRenderingContext2D,
    node: MindMapNode | null, // Takes the AST node directly
    currentViewport: Readonly<Viewport>,
    currentSelectedNodeId: string | null,
    currentEditingNodeId: string | null,
    searchTerm: string,
    highlightIds: Set<string>,
    currentMatchId: string | null
  ) => {
    if (!node) return;

    // 合并节点样式：节点自带 style + getNodeStyle 回调
    const mergedStyle = {
      ...(node.style || {}),
      ...(getNodeStyle ? getNodeStyle(node, state) : {})
    };
    drawNode(
      ctx,
      node, // Pass the AST node
      node.id === currentSelectedNodeId,
      // node.id === currentEditingNodeId,
      highlightIds.has(node.id),
      node.id === currentMatchId,
      searchTerm,
      mergedStyle // 传递自定义样式
    );

    // 2. If the node is not collapsed and has children, draw connections
    if (!node.isCollapsed && node.children && node.children.length > 0) {
      for (const childNode of node.children) { // Children are now MindMapNode objects
        if (childNode) { // childNode is already the object
          const parentAnchor: Point = {
            x: node.position.x + node.width,
            y: node.position.y + node.height / 2,
          };
          const childAnchor: Point = {
            x: childNode.position.x,
            y: childNode.position.y + childNode.height / 2,
          };
          drawConnection(ctx, parentAnchor, childAnchor);
        }
      }
    }
    
    // 3. Draw collapse button on top of lines if node has children
    if (node.children && node.children.length > 0) {
      drawCollapseButton(ctx, node, node.isCollapsed, node.childrenCount);
    }

    // 4. If the node is not collapsed and has children, recursively draw child branches
    if (!node.isCollapsed && node.children && node.children.length > 0) {
      for (const childNode of node.children) {
        if (childNode) {
          drawBranchRecursive(ctx, childNode, currentViewport, currentSelectedNodeId, currentEditingNodeId, searchTerm, highlightIds, currentMatchId);
        }
      }
    }
  }, []);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = currentCanvasSize.width * window.devicePixelRatio;
    canvas.height = currentCanvasSize.height * window.devicePixelRatio;
    canvas.style.width = `${currentCanvasSize.width}px`;
    canvas.style.height = `${currentCanvasSize.height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 1. 填充背景色
    ctx.fillStyle = canvasBackgroundColor || CANVAS_BACKGROUND_COLOR;
    ctx.fillRect(0, 0, currentCanvasSize.width, currentCanvasSize.height);

    // 2. 可选：绘制点状背景
    if (showDotBackground) {
      const dotSpacing = 24;
      const dotRadius = 1.2;
      ctx.save();
      ctx.fillStyle = '#d1d5db'; // Tailwind gray-300
      for (let x = 0; x < currentCanvasSize.width; x += dotSpacing) {
        for (let y = 0; y < currentCanvasSize.height; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Start drawing from the rootNode
    if (rootNode) {
      drawBranchRecursive(ctx, rootNode, viewport, selectedNodeId, editingNodeId, currentSearchTerm, highlightedNodeIds, currentMatchNodeId);
    }

    ctx.restore();
  }, [rootNode, selectedNodeId, editingNodeId, viewport, currentCanvasSize, currentSearchTerm, highlightedNodeIds, currentMatchNodeId, isReadOnly, drawBranchRecursive, canvasBackgroundColor, showDotBackground]);

  const getMousePositionOnCanvas = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const mousePos = getMousePositionOnCanvas(e);
    setLastMousePosition(mousePos);
    const worldPos = screenToWorld(mousePos, viewport);

    // Check for click on collapse/expand button first by traversing
    let buttonClickedProcessed = false;
    function checkCollapseButtonRecursive(node: MindMapNode | null): boolean {
        if (!node) return false;
        
        // Check children first for "topmost" button, but only if parent is expanded
        if (!node.isCollapsed) {
          for (const child of node.children) {
              if (checkCollapseButtonRecursive(child)) return true;
          }
        }

        if (node.children && node.children.length > 0) { // Check current node's button
            const buttonCenterX = node.position.x + node.width;
            const buttonCenterY = node.position.y + node.height / 2;
            const distSq = (worldPos.x - buttonCenterX) ** 2 + (worldPos.y - buttonCenterY) ** 2;
            if (distSq <= COLLAPSE_BUTTON_RADIUS ** 2) {
              toggleNodeCollapse(node.id);
              return true; // Button click processed
            }
        }
        return false;
    }

    if (checkCollapseButtonRecursive(rootNode)) {
        buttonClickedProcessed = true;
    }
    
    if (buttonClickedProcessed) return; // If button was clicked, stop further processing

    const clickedNode = findNodeInASTFromPoint(rootNode, worldPos, viewport);

    if (clickedNode) {
      if (editingNodeId !== clickedNode.id) {
        setEditingNode(null); // Stop editing if clicking on a different node or same node non-edit area
      }
      setSelectedNode(clickedNode.id);
      if (!isReadOnly) {
        setIsDraggingNode(true);
        setDragStartPoint(worldPos);
        setDragStartNodePosition({ ...clickedNode.position });
      } else { // If read-only, clicking a node doesn't start drag, but allows panning if background is dragged
        setIsPanning(true); 
      }
    } else {
      if (editingNodeId) { // Clicked on background while editing
        setEditingNode(null);
      }
      setSelectedNode(null);
      setIsPanning(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!lastMousePosition) return;
    const mousePos = getMousePositionOnCanvas(e);
    const worldPos = screenToWorld(mousePos, viewport);

    if (isDraggingNode && selectedNodeId && dragStartPoint && dragStartNodePosition && !isReadOnly) {
      const selectedNodeInstance = findNodeInAST(rootNode, selectedNodeId);
      if (!selectedNodeInstance) return;

      if (editingNodeId === selectedNodeId) { // If was editing, stop editing when drag starts
        setEditingNode(null);
      }
      const dx = worldPos.x - dragStartPoint.x;
      const dy = worldPos.y - dragStartPoint.y;
      
      // Basic threshold check to differentiate click from drag
      const dragDistance = Math.sqrt(
         (worldPos.x - dragStartPoint.x) ** 2 + 
         (worldPos.y - dragStartPoint.y) ** 2
      );

      if (dragDistance > DRAG_THRESHOLD / viewport.zoom ) { // Apply threshold
          pan(dx, dy); // 临时用 pan 替代，实际应实现节点拖拽
      }
    } else if (isPanning) {
      const dx = mousePos.x - lastMousePosition.x;
      const dy = mousePos.y - lastMousePosition.y;
      pan(dx, dy);
    }
    setLastMousePosition(mousePos);
  };

  const handleMouseUp = () => {
    setIsDraggingNode(false);
    setIsPanning(false);
    setDragStartPoint(null);
    setDragStartNodePosition(null);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isReadOnly) return;

    const mousePos = getMousePositionOnCanvas(e);
    const worldPos = screenToWorld(mousePos, viewport);
    
    // Check if click was on a collapse button first (reverse traversal for topmost)
    function wasCollapseButtonClicked(node: MindMapNode | null): boolean {
        if (!node) return false;
        if (!node.isCollapsed) { // Only check children's buttons if parent is expanded
            for (let i = node.children.length - 1; i >=0; i--) {
                 if (wasCollapseButtonClicked(node.children[i])) return true;
            }
        }
        if (node.children && node.children.length > 0) {
            const buttonCenterX = node.position.x + node.width;
            const buttonCenterY = node.position.y + node.height / 2;
            const distSq = (worldPos.x - buttonCenterX)**2 + (worldPos.y - buttonCenterY)**2;
            if (distSq <= COLLAPSE_BUTTON_RADIUS**2) return true;
        }
        return false;
    }
    if (wasCollapseButtonClicked(rootNode)) return; // Don't edit if button was double-clicked

    const nodeToEdit = findNodeInASTFromPoint(rootNode, worldPos, viewport);
    
    if (nodeToEdit) {
      setSelectedNode(nodeToEdit.id);
      setEditingNode(nodeToEdit.id);
    } else {
      if (editingNodeId) setEditingNode(null); // Clicked background
    }
  };

  const handleNodeEditSave = (text: string) => {
    if (editingNodeId && !isReadOnly) {
      updateNodeText(editingNodeId, text);
    }
    setEditingNode(null);
  };

  const handleNodeEditCancel = () => {
    setEditingNode(null);
  };

  const handleCanvasContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation(); // 防止冒泡到 window，避免菜单被立即关闭
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldPos = screenToWorld(mousePos, viewport);
    const node = findNodeInASTFromPoint(rootNode, worldPos, viewport);
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, node });
  };



  // 右键菜单分组
  const { fitView, centerView } = mindMapHookInstance;
  const contextMenuGroups: ContextMenuGroup[] = getContextMenuGroups
    ? getContextMenuGroups(contextMenu.node, state)
    : (
      contextMenu.node
        ? [
            // 节点菜单（原有逻辑）
            {
              actions: [
                {
                  key: 'add-sibling',
                  label: '添加同级节点',
                  icon: <FaPlus />,
                  onClick: () => addSiblingNodeCommand.execute(getMenuCommandState(contextMenu.node!.id), { addNode: mindMapAddNode }),
                  disabled: !addSiblingNodeCommand.canExecute(getMenuCommandState(contextMenu.node!.id))
                },
                {
                  key: 'add-child',
                  label: '添加子节点',
                  icon: <FaPlus />,
                  onClick: () => addChildNodeCommand.execute(getMenuCommandState(contextMenu.node!.id), { addNode: mindMapAddNode }),
                  disabled: !addChildNodeCommand.canExecute(getMenuCommandState(contextMenu.node!.id))
                },
              ]
            },
            {
              actions: [
                {
                  key: 'delete',
                  label: '删除节点',
                  icon: <FaTrash />,
                  onClick: () => deleteNodeCommand.execute(getMenuCommandState(contextMenu.node!.id), { deleteNode: mindMapDeleteNode }),
                  disabled: !deleteNodeCommand.canExecute(getMenuCommandState(contextMenu.node!.id))
                }
              ]
            },
            {
              actions: [
                ...(contextMenu.node!.children && contextMenu.node!.children.length > 0 ? [
                  contextMenu.node!.isCollapsed
                    ? { key: 'expand', label: '展开当前节点', icon: <FaChevronDown />, onClick: () => toggleNodeCollapse(contextMenu.node!.id) }
                    : { key: 'collapse', label: '收起当前节点', icon: <FaChevronUp />, onClick: () => toggleNodeCollapse(contextMenu.node!.id) }
                ] : []),
                { key: 'expand-all', label: expandAllCommand.label, icon: <FaExpand />, onClick: () => expandAllCommand.execute(state, { dispatch: mindMapHookInstance.dispatch }), disabled: !expandAllCommand.canExecute(state) },
                { key: 'collapse-all', label: collapseAllCommand.label, icon: <FaCompress />, onClick: () => collapseAllCommand.execute(state, { dispatch: mindMapHookInstance.dispatch }), disabled: !collapseAllCommand.canExecute(state) },
              ]
            }
          ].filter(group => group.actions.length > 0)
        : [
            // 空白处菜单
            {
              actions: [
                { key: 'expand-all', label: expandAllCommand.label, icon: <FaExpand />, onClick: () => expandAllCommand.execute(state, { dispatch: mindMapHookInstance.dispatch }), disabled: !expandAllCommand.canExecute(state) },
                { key: 'collapse-all', label: collapseAllCommand.label, icon: <FaCompress />, onClick: () => collapseAllCommand.execute(state, { dispatch: mindMapHookInstance.dispatch }), disabled: !collapseAllCommand.canExecute(state) },
                { key: 'center-view', label: centerViewCommand.label, icon: <FiCrosshair />, onClick: () => centerViewCommand.execute(state, { centerView }), disabled: !centerViewCommand.canExecute(state) },
                { key: 'fit-view', label: fitViewCommand.label, icon: <FiBox />, onClick: () => fitViewCommand.execute(state, { fitView }), disabled: !fitViewCommand.canExecute(state) },
              ]
            }
          ]
    );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查焦点是否在输入框上，如果是则不处理全局键盘事件
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        (activeElement as HTMLElement).contentEditable === 'true'
      )) {
        return; // 焦点在输入框上，不处理全局键盘事件
      }

      if (editingNodeId) return; // Ignore keyboard shortcuts while editing text

      if (isReadOnly) {
        // Limited shortcuts in read-only mode (e.g., zoom)
        if (e.key === '+' || e.key === '=') { 
          const centerCanvas: Point = {x: currentCanvasSize.width / 2, y: currentCanvasSize.height / 2};
          zoom(-100, centerCanvas); 
          e.preventDefault();
        } else if (e.key === '-' || e.key === '_') { 
            const centerCanvas: Point = {x: currentCanvasSize.width / 2, y: currentCanvasSize.height / 2};
            zoom(100, centerCanvas); 
            e.preventDefault();
        }
        return; // No other actions in read-only
      }
      
      // --- Editable Mode Shortcuts ---
      const currentSelectedNode = selectedNodeId ? findNodeInAST(rootNode, selectedNodeId) : null;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          if (currentSelectedNode && currentSelectedNode.id === rootNode?.id && (!rootNode.children || rootNode.children.length === 0)) {
             alert("Cannot delete the last node.");
          } else {
            mindMapDeleteNode(selectedNodeId);
          }
          e.preventDefault();
        }
      } else if (e.key === 'Enter' || e.key === 'F2') {
        if (selectedNodeId) {
          setEditingNode(selectedNodeId);
          e.preventDefault();
        }
      } else if (e.key === 'Tab' && !e.shiftKey) { // Add child
        if (selectedNodeId) {
          mindMapAddNode(NEW_NODE_TEXT, selectedNodeId); 
          e.preventDefault();
        }
      } else if (e.key === 'Insert' || (e.shiftKey && e.key === 'Tab')) { // Add sibling (or root if nothing sensible selected)
        let parentIdForSibling: string | null = null;
        if (currentSelectedNode && rootNode) {
            const parentInfo = findNodeAndParentInAST(rootNode, currentSelectedNode.id);
            if (parentInfo && parentInfo.parent) {
                parentIdForSibling = parentInfo.parent.id;
            }
            // If selected is root, parentIdForSibling remains null, addNode logic handles creating another root-level context if needed/allowed
        }
        mindMapAddNode(NEW_NODE_TEXT, parentIdForSibling);
        e.preventDefault();
      } else if (e.key === '+' || e.key === '=') { // Zoom in
        const centerCanvas: Point = { x: currentCanvasSize.width / 2, y: currentCanvasSize.height / 2 };
        zoom(-100, centerCanvas);
        e.preventDefault();
      } else if (e.key === '-' || e.key === '_') { // Zoom out
        const centerCanvas: Point = { x: currentCanvasSize.width / 2, y: currentCanvasSize.height / 2 };
        zoom(100, centerCanvas);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, editingNodeId, mindMapDeleteNode, setEditingNode, mindMapAddNode, zoom, currentCanvasSize, rootNode, isReadOnly, updateNodeText, pan, toggleNodeCollapse, findNodeAndParentInAST]); // Added findNodeAndParentInAST due to usage in keydown
  
  // 手动处理wheel事件以避免passive listener警告
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      zoom(e.deltaY, mousePos);
    };

    // 使用passive: false选项来允许preventDefault
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [zoom]);
  
  const nodeToEdit = editingNodeId ? findNodeInAST(rootNode, editingNodeId) : null;


  return (
    <div className="flex-grow w-full h-full relative overflow-hidden bg-gray-200" style={{ cursor: isPanning ? 'grabbing' : (isDraggingNode && !isReadOnly ? 'move' : 'default') }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        aria-label="测试计划思维导图"
        onContextMenu={enableContextMenu ? handleCanvasContextMenu : undefined}
      />
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        groups={contextMenuGroups}
        onClose={() => setContextMenu({ visible: false, x: 0, y: 0, node: null })}
      />
      {nodeToEdit && canvasRef.current && canvasBounds && !isReadOnly && (
        <NodeEditInput
          node={nodeToEdit}
          viewport={viewport}
          onSave={handleNodeEditSave}
          onCancel={handleNodeEditCancel}
          canvasBounds={canvasBounds}
        />
      )}
    </div>
  );
};

export default MindMapCanvas;
