import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useMindMap } from '../hooks/useMindMap';
import { MindMapNode, Point, Viewport } from '../types'; // Changed Node to MindMapNode
import { 
    drawNode, drawConnection, isPointInNode, screenToWorld, drawCollapseButton 
} from '../utils/canvasUtils';
import { CANVAS_BACKGROUND_COLOR, DRAG_THRESHOLD, NEW_NODE_TEXT, COLLAPSE_BUTTON_RADIUS } from '../constants';
import NodeEditInput from './NodeEditInput';
import { findNodeInAST, findNodeAndParentInAST } from '../utils/nodeUtils';


interface MindMapCanvasProps {
  mindMapHookInstance: ReturnType<typeof useMindMap>;
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


const MindMapCanvas: React.FC<MindMapCanvasProps> = ({ mindMapHookInstance }) => {
  const {
    state, setSelectedNode, setEditingNode, moveNode, zoom, pan,
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

    // 1. Draw the current node body and text
    drawNode(
      ctx,
      node, // Pass the AST node
      node.id === currentSelectedNodeId,
      node.id === currentEditingNodeId,
      highlightIds.has(node.id),
      node.id === currentMatchId,
      searchTerm
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

    ctx.fillStyle = CANVAS_BACKGROUND_COLOR;
    ctx.fillRect(0, 0, currentCanvasSize.width, currentCanvasSize.height);

    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Start drawing from the rootNode
    if (rootNode) {
      drawBranchRecursive(ctx, rootNode, viewport, selectedNodeId, editingNodeId, currentSearchTerm, highlightedNodeIds, currentMatchNodeId);
    }

    ctx.restore();
  }, [rootNode, selectedNodeId, editingNodeId, viewport, currentCanvasSize, currentSearchTerm, highlightedNodeIds, currentMatchNodeId, isReadOnly, drawBranchRecursive]);

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
          moveNode(selectedNodeId, {
            x: dragStartNodePosition.x + dx,
            y: dragStartNodePosition.y + dy,
          });
      }
    } else if (isPanning) {
      const dx = mousePos.x - lastMousePosition.x;
      const dy = mousePos.y - lastMousePosition.y;
      pan(dx, dy);
    }
    setLastMousePosition(mousePos);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
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
        onMouseLeave={handleMouseUp} // Important to reset state if mouse leaves canvas while dragging
        onDoubleClick={handleDoubleClick}
        aria-label="测试计划思维导图"
      />
      {nodeToEdit && canvasRef.current && canvasBounds && !isReadOnly && (
        <NodeEditInput
          node={nodeToEdit} // Pass the actual AST node object
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
