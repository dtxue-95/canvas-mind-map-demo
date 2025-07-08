import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useMindMap } from '../hooks/useMindMap';
import { MindMapNode, Point, Viewport, MindMapState, MindMapPriorityConfig, LineType, EdgeConfig, BUILTIN_NODE_TYPE_CONFIG } from '../types'; // Changed Node to MindMapNode
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
import MessageBox, { MessageItem, MessageType } from './MessageBox';
import message from './message';

function PriorityLabel({ label, color, bg }: { label: string; color: string; bg?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 24,
        borderRadius: 8,
        background: bg || '#fff',
        color,
        border: `1.5px solid ${color}`,
        fontWeight: 500,
        fontSize: 14,
        padding: '0 12px',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        minWidth: 36,
        justifyContent: 'center'
      }}
    >
      {label}
    </span>
  );
}

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
  /**
   * 拖动状态变化回调（用于外部阻断自动居中）
   */
  onDraggingChange?: (dragging: boolean) => void;
  priorityConfig?: MindMapPriorityConfig;
  lineType?: LineType;
  showArrow?: boolean;
  /**
   * 节点移动规则回调，用于自定义节点拖拽换父的权限控制
   */
  canMoveNode?: (dragNode: MindMapNode, targetParent: MindMapNode) => boolean;
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

// 判断节点类型是否允许编辑/添加优先级
function canEditPriority(node: any, priorityConfig: any, isReadOnly: boolean) {
  if (!priorityConfig || !priorityConfig.enabled || !priorityConfig.editable || isReadOnly) return false;
  if (!Array.isArray(priorityConfig.options) || priorityConfig.options.length === 0) return false;
  if (priorityConfig.typeWhiteList && !priorityConfig.typeWhiteList.includes(node.nodeType)) return false;
  return true;
}

function isBuiltinNodeType(nodeType?: string) {
  return !!nodeType && Object.prototype.hasOwnProperty.call(BUILTIN_NODE_TYPE_CONFIG, nodeType);
}

// 计算两点距离
function getDistance(p1: Point, p2: Point) {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// 绘制 TAPD 风格吸附线
function drawTapdSnapLine(ctx: CanvasRenderingContext2D, targetNode: MindMapNode | null | undefined) {
  if (!targetNode || !targetNode.position || typeof targetNode.width !== 'number' || typeof targetNode.height !== 'number') return;
  const centerY = targetNode.position.y + targetNode.height / 2;
  const startX = targetNode.position.x - 20;
  const endX = targetNode.position.x + targetNode.width + 20;
  ctx.save();
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#05966955';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(startX, centerY);
  ctx.lineTo(endX, centerY);
  ctx.stroke();
  // 两端圆点
  ctx.beginPath();
  ctx.arc(startX, centerY, 6, 0, 2 * Math.PI);
  ctx.arc(endX, centerY, 6, 0, 2 * Math.PI);
  ctx.fillStyle = '#059669';
  ctx.shadowBlur = 0;
  ctx.fill();
  ctx.restore();
}

const MindMapCanvas: React.FC<MindMapCanvasProps> = ({ mindMapHookInstance, getNodeStyle, canvasBackgroundColor, showDotBackground, enableContextMenu = true, getContextMenuGroups, onDraggingChange, priorityConfig, lineType = 'polyline', showArrow = false, canMoveNode }) => {
  const {
    state, setSelectedNode, setEditingNode, zoom, pan,
    updateNodeText, addNode: mindMapAddNode, deleteNode: mindMapDeleteNode,
    toggleNodeCollapse, updateNodePriority
  } = mindMapHookInstance;
  const {
    rootNode, // Changed from nodes and rootId
    selectedNodeId, editingNodeId, viewport,
    currentSearchTerm, highlightedNodeIds, currentMatchNodeId, isReadOnly
  } = state;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingNodeRef = useRef(false);
  const lastMousePositionRef = useRef<Point | null>(null);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const [currentCanvasSize, setCurrentCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [canvasBounds, setCanvasBounds] = useState<DOMRect | null>(null);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; node: MindMapNode | null }>({ visible: false, x: 0, y: 0, node: null });
  const [editingNodeDynamicWidth, setEditingNodeDynamicWidth] = useState<number | null>(null);
  const didFitViewRef = useRef(false);
  const [dashOffset, setDashOffset] = useState(0);
  const hasAnimatedDashed = useRef(false);

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<{ node: MindMapNode; mousePos: Point } | null>(null);
  const [dragCandidateId, setDragCandidateId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<Point | null>(null);
  const DRAG_THRESHOLD = 5;

  const [messages, setMessages] = useState<MessageItem[]>([]);
  // 支持 showMessage('内容') 或 showMessage({content,type,duration})
  const showMessage = (msg: string | { content: string; type?: MessageType; duration?: number }) => {
    const id = Date.now() + Math.random();
    if (typeof msg === 'string') {
      setMessages(prev => [...prev, { id, content: msg, type: 'info', duration: 3000 }]);
    } else {
      setMessages(prev => [...prev, { id, ...msg }]);
    }
  };
  const removeMessage = (id: number) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const getMenuCommandState = (nodeId: string) => ({
    ...state,
    selectedNodeId: nodeId
  });

  // 获取拖拽节点及其所有子节点的副本
  const getDragNodeWithChildren = useCallback((nodeId: string): MindMapNode | null => {
    const node = findNodeInAST(rootNode, nodeId);
    if (!node) return null;
    
    // 深拷贝节点及其所有子节点
    const cloneNode = (n: MindMapNode): MindMapNode => ({
      ...n,
      children: n.children.map(cloneNode)
    });
    
    return cloneNode(node);
  }, [rootNode]);

  // 绘制拖拽预览节点
  const drawDragPreview = useCallback((
    ctx: CanvasRenderingContext2D,
    dragNode: MindMapNode,
    mousePos: Point,
    viewport: Viewport
  ) => {
    // 计算拖拽节点的世界坐标偏移
    const worldPos = screenToWorld(mousePos, viewport);
    const offsetX = worldPos.x - dragNode.position.x;
    const offsetY = worldPos.y - dragNode.position.y;
    
    // 递归绘制拖拽预览节点
    const drawPreviewNode = (node: MindMapNode, parentOffset: Point) => {
      const previewNode: MindMapNode = {
        ...node,
        position: {
          x: node.position.x + parentOffset.x,
          y: node.position.y + parentOffset.y
        }
      };
      
      // 绘制半透明的预览节点
      const mergedStyle = {
        ...(node.style || {}),
        ...(getNodeStyle ? getNodeStyle(node, state) : {}),
        opacity: 0.7,
        border: '2px dashed #3b82f6'
      };
      
      drawNode(
        ctx,
        previewNode,
        false,
        false,
        false,
        '',
        mergedStyle,
        mindMapHookInstance.typeConfig,
        priorityConfig
      );
      
      // 绘制子节点连线
      if (!node.isCollapsed && node.children && node.children.length > 0) {
        for (const childNode of node.children) {
          const childPreviewNode: MindMapNode = {
            ...childNode,
            position: {
              x: childNode.position.x + parentOffset.x,
              y: childNode.position.y + parentOffset.y
            }
          };
          
          const parentAnchor: Point = {
            x: previewNode.position.x + previewNode.width,
            y: previewNode.position.y + previewNode.height / 2,
          };
          const childAnchor: Point = {
            x: childPreviewNode.position.x,
            y: childPreviewNode.position.y + childPreviewNode.height / 2,
          };
          
          // 绘制虚线连线
          ctx.save();
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(parentAnchor.x, parentAnchor.y);
          ctx.lineTo(childAnchor.x, childAnchor.y);
          ctx.stroke();
          ctx.restore();
          
          drawPreviewNode(childNode, parentOffset);
        }
      }
    };
    
    drawPreviewNode(dragNode, { x: offsetX, y: offsetY });
  }, [getNodeStyle, state, mindMapHookInstance.typeConfig, priorityConfig]);

  // 绘制拖拽辅助线
  const drawDragGuide = useCallback((
    ctx: CanvasRenderingContext2D,
    dragNode: MindMapNode,
    targetNode: MindMapNode,
    mousePos: Point,
    viewport: Viewport,
    isAbsorbed: boolean
  ) => {
    const worldPos = screenToWorld(mousePos, viewport);
    // 拖拽节点的当前位置
    const dragCenter: Point = {
      x: worldPos.x,
      y: worldPos.y
    };
    // 目标节点中心
    const targetCenter: Point = {
      x: targetNode.position.x + targetNode.width / 2,
      y: targetNode.position.y + targetNode.height / 2,
    };
    // 目标节点的右侧中点
    const targetAnchor: Point = {
      x: targetNode.position.x + targetNode.width,
      y: targetNode.position.y + targetNode.height / 2,
    };
    ctx.save();
    // 只要吸附判定成立，始终绘制辅助线和对齐线
    if (isAbsorbed) {
      // 辅助连接线
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dragCenter.x, dragCenter.y);
      ctx.lineTo(targetAnchor.x, targetAnchor.y);
      ctx.stroke();
      ctx.setLineDash([]);
      // 横穿目标节点的绿色虚线对齐线
      ctx.save();
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(targetNode.position.x - 20, targetCenter.y);
      ctx.lineTo(targetNode.position.x + targetNode.width + 20, targetCenter.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    ctx.restore();
  }, []);

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

  useEffect(() => {
    let running = true;
    function animate() {
      setDashOffset(prev => (prev + 2) % 1000);
      if (running) requestAnimationFrame(animate);
    }
    running = true;
    animate();
    return () => { running = false; };
  }, []);

  useEffect(() => {
    // 触发 canvas 重绘
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // 这里假设有 drawAll 或 drawCanvas 函数，直接触发重绘
        // 你可以用已有的 drawAll 逻辑
        // drawAll();
        // 这里直接触发一次 re-render
        setCurrentCanvasSize(size => ({ ...size }));
      }
    }
  }, [dashOffset]);

  const drawBranchRecursive = useCallback((
    ctx: CanvasRenderingContext2D,
    node: MindMapNode | null,
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
      mergedStyle, // 传递自定义样式
      mindMapHookInstance.typeConfig, // 传递类型配置
      priorityConfig // 新增：传递优先级配置
    );

    // 2. If the node is not collapsed and has children, draw connections
    if (!node.isCollapsed && node.children && node.children.length > 0) {
      for (const childNode of node.children) {
        if (childNode) {
          const parentAnchor: Point = {
            x: node.position.x + node.width,
            y: node.position.y + node.height / 2,
          };
          const childAnchor: Point = {
            x: childNode.position.x,
            y: childNode.position.y + childNode.height / 2,
          };
          // 优先节点 edgeConfig，否则全局
          const edgeConf: EdgeConfig = childNode.edgeConfig || node.edgeConfig || { type: lineType, showArrow };
          const edgeType = edgeConf.type || lineType;
          const isAnimated = edgeType === 'animated-dashed';
          if (isAnimated) hasAnimatedDashed.current = true;
          drawConnection(
            ctx,
            parentAnchor,
            childAnchor,
            edgeType,
            edgeConf.showArrow ?? showArrow,
            isAnimated ? dashOffset : 0
          );
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
  }, [getNodeStyle, state, mindMapHookInstance.typeConfig, priorityConfig, lineType, showArrow, dashOffset]);

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

    // 编辑时不绘制正在编辑的节点（避免重影）
    const editingId = editingNodeId;
    function drawBranchRecursiveNoEdit(
      ctx: CanvasRenderingContext2D,
      node: MindMapNode | null
    ) {
      if (!node) return;
      // 拖拽时，遇到拖拽节点本身，直接跳过（不渲染该节点及其子树），但父节点和兄弟节点正常
      if (draggingNodeId && node.id === draggingNodeId) {
        return;
      }
      const isEditing = node.id === editingId;
      // 1. 只跳过 drawNode，其他都要执行
      if (!isEditing) {
        const mergedStyle = {
          ...(node.style || {}),
          ...(getNodeStyle ? getNodeStyle(node, state) : {})
        };
        drawNode(
          ctx,
          node,
          node.id === selectedNodeId,
          highlightedNodeIds.has(node.id),
          node.id === currentMatchNodeId,
          currentSearchTerm,
          mergedStyle,
          mindMapHookInstance.typeConfig,
          priorityConfig
        );
      }
      // 2. 父节点到子节点的连线、折叠按钮始终要画
      if (!node.isCollapsed && node.children && node.children.length > 0) {
        for (const childNode of node.children) {
          if (draggingNodeId && childNode.id === draggingNodeId) continue; // 跳过被拖拽节点
          if (childNode) {
            // 连线起点：如果当前节点是编辑节点，用 editingNodeDynamicWidth，否则用 node.width
            const nodeRightX = isEditing && editingNodeDynamicWidth != null
              ? node.position.x + editingNodeDynamicWidth
              : node.position.x + node.width;
            drawConnection(
              ctx,
              { x: nodeRightX, y: node.position.y + node.height / 2 },
              { x: childNode.position.x, y: childNode.position.y + childNode.height / 2 },
              lineType,
              showArrow
            );
          }
        }
      }
      if (node.children && node.children.length > 0) {
        drawCollapseButton(ctx, node, node.isCollapsed, node.childrenCount);
      }
      // 3. 递归渲染子节点
      if (!node.isCollapsed && node.children && node.children.length > 0) {
        for (const childNode of node.children) {
          if (draggingNodeId && childNode.id === draggingNodeId) continue; // 跳过被拖拽节点
          if (childNode) {
            drawBranchRecursiveNoEdit(ctx, childNode);
          }
        }
      }
    }
    if (rootNode) {
      drawBranchRecursiveNoEdit(ctx, rootNode);
    }
    
    // 绘制拖拽预览
    if (dragPreview && draggingNodeId) {
      drawDragPreview(ctx, dragPreview.node, dragPreview.mousePos, viewport);
      // 如果有悬停目标，绘制辅助线
      if (dragOverNodeId) {
        const targetNode = findNodeInAST(rootNode, dragOverNodeId);
        if (targetNode && targetNode.position && typeof targetNode.width === 'number' && typeof targetNode.height === 'number') {
          // 智能吸附判定：拖拽节点中心点落在目标节点包围盒外扩50px区域内
          const worldPos = screenToWorld(dragPreview.mousePos, viewport);
          const dragCenter = { x: worldPos.x, y: worldPos.y };
          const targetCenter = {
            x: (targetNode.position?.x || 0) + (targetNode.width || 0) / 2,
            y: (targetNode.position?.y || 0) + (targetNode.height || 0) / 2,
          };
          const isAbsorbed = getDistance(dragCenter, targetCenter) < 100;
          drawDragGuide(ctx, dragPreview.node, targetNode, dragPreview.mousePos, viewport, isAbsorbed);
        }
      }
    }
    
    ctx.restore();
  }, [rootNode, selectedNodeId, editingNodeId, viewport, currentCanvasSize, currentSearchTerm, highlightedNodeIds, currentMatchNodeId, isReadOnly, getNodeStyle, canvasBackgroundColor, showDotBackground, state, mindMapHookInstance.typeConfig, editingNodeDynamicWidth, priorityConfig, draggingNodeId, dragPreview, dragOverNodeId, drawDragPreview, drawDragGuide]);

  // 判断节点是否为拖拽节点的子孙节点
  function isDescendantOfDraggingNode(node: MindMapNode, draggingId: string): boolean {
    if (!node || !node.children) return false;
    for (const child of node.children) {
      if (child.id === draggingId || isDescendantOfDraggingNode(child, draggingId)) {
        return true;
      }
    }
    return false;
  }

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
    // console.log('🖱️ 画布鼠标按下:', { button: e.button, draggingNodeId, isReadOnly });
    if (e.button !== 0 && e.button !== 2) return;
    if (draggingNodeId) {
      // console.log('⚠️ 正在拖拽节点，忽略画布拖拽');
      return;
    }
    const mousePos = getMousePositionOnCanvas(e);
    lastMousePositionRef.current = mousePos;
    const worldPos = screenToWorld(mousePos, viewport);

    // Check for click on collapse/expand button first by traversing
    let buttonClickedProcessed = false;
    function checkCollapseButtonRecursive(node: MindMapNode | null): boolean {
      if (!node) return false;
      if (!node.isCollapsed) {
        for (const child of node.children) {
          if (checkCollapseButtonRecursive(child)) return true;
        }
      }
      if (node.children && node.children.length > 0) {
        const buttonCenterX = node.position.x + node.width;
        const buttonCenterY = node.position.y + node.height / 2;
        const distSq = (worldPos.x - buttonCenterX) ** 2 + (worldPos.y - buttonCenterY) ** 2;
        if (distSq <= COLLAPSE_BUTTON_RADIUS ** 2) {
          toggleNodeCollapse(node.id);
          return true;
        }
      }
      return false;
    }
    if (checkCollapseButtonRecursive(rootNode)) {
      buttonClickedProcessed = true;
    }
    if (buttonClickedProcessed) return;
    
    const clickedNode = findNodeInASTFromPoint(rootNode, worldPos, viewport);
    // console.log('🎯 画布点击的节点:', { clickedNodeId: clickedNode?.id, clickedNodeText: clickedNode?.text });
    
    // 拖拽判定：只记录候选节点和起点，不立即脱离
    if (clickedNode && !isReadOnly) {
      setDragCandidateId(clickedNode.id);
      setDragStartPos(mousePos);
      setDragOverNodeId(null);
      // 设置选中状态
      if (editingNodeId !== clickedNode.id) {
        setEditingNode(null);
      }
      setSelectedNode(clickedNode.id);
      return; // 不启动画布拖拽
    }

    if (clickedNode) {
      if (editingNodeId !== clickedNode.id) {
        setEditingNode(null);
      }
      setSelectedNode(clickedNode.id);
    } else {
      if (editingNodeId) {
        setEditingNode(null);
      }
      setSelectedNode(null);
    }
    // 启动画布拖拽（包括只读模式）
    setIsDraggingNode(true); // 仅用于 UI
    isDraggingNodeRef.current = true;
    if (typeof onDraggingChange === 'function') onDraggingChange(true);
    // console.log('🖱️ 画布拖拽开始');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 拖拽判定：如果有 dragCandidateId，判断是否超过阈值，超过则进入拖拽模式
    if (dragCandidateId && dragStartPos) {
      const mousePos = getMousePositionOnCanvas(e);
      const dx = mousePos.x - dragStartPos.x;
      const dy = mousePos.y - dragStartPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        setDraggingNodeId(dragCandidateId);
        setDragCandidateId(null);
        setDragStartPos(null);
        // 创建拖拽预览
        const dragNode = getDragNodeWithChildren(dragCandidateId);
        if (dragNode) {
          setDragPreview({ node: dragNode, mousePos });
        }
        return;
      }
    }
    // 如果正在拖拽节点，检测悬停目标
    if (draggingNodeId) {
      const mousePos = getMousePositionOnCanvas(e);
      if (dragPreview) {
        setDragPreview({ ...dragPreview, mousePos });
      }
      const worldPos = screenToWorld(mousePos, viewport);
      // 获取父节点 id
      let parentId: string | null = null;
      const parentInfo = findNodeAndParentInAST(rootNode, draggingNodeId);
      if (parentInfo && parentInfo.parent) {
        parentId = parentInfo.parent.id;
      }
      // 新吸附判定：遍历所有节点，排除自身和父节点
      function findClosestNodeInRange(node: MindMapNode | null, excludeIds: string[], point: Point, maxDist: number): MindMapNode | null {
        let closest: MindMapNode | null = null;
        let minDist = Infinity;
        function dfs(n: MindMapNode | null) {
          if (!n) return;
          if (excludeIds.includes(n.id)) return;
          const center = {
            x: n.position.x + n.width / 2,
            y: n.position.y + n.height / 2,
          };
          const dist = getDistance(point, center);
          if (dist < maxDist && dist < minDist) {
            closest = n;
            minDist = dist;
          }
          if (n.children && n.children.length > 0) {
            n.children.forEach(child => dfs(child));
          }
        }
        dfs(node);
        return closest;
      }
      const excludeIds = [draggingNodeId];
      if (parentId) excludeIds.push(parentId);
      const hoveredNode = findClosestNodeInRange(rootNode, excludeIds, worldPos, 100);
      if (hoveredNode) {
        if (dragOverNodeId !== hoveredNode.id) {
          setDragOverNodeId(hoveredNode.id);
        }
      } else if (dragOverNodeId) {
        setDragOverNodeId(null);
      }
      return;
    }
    
    if (!lastMousePositionRef.current) return;
    const mousePos = getMousePositionOnCanvas(e);
    if (isDraggingNodeRef.current) {
      const dx = (mousePos.x - lastMousePositionRef.current.x) / viewport.zoom;
      const dy = (mousePos.y - lastMousePositionRef.current.y) / viewport.zoom;
      pan(dx, dy);
      // console.log('🖱️ 画布拖拽移动:', { dx, dy });
    }
    lastMousePositionRef.current = mousePos;
  };

  const handleMouseUp = () => {
    // console.log('🖱️ 画布鼠标松开:', { draggingNodeId, isDraggingNodeRef: isDraggingNodeRef.current });
    // 拖拽判定：如果只是点击未移动，重置 dragCandidateId/dragStartPos
    if (dragCandidateId) {
      setDragCandidateId(null);
      setDragStartPos(null);
      return;
    }
    // 如果正在拖拽节点，执行节点拖拽换父
    if (draggingNodeId) {
      // console.log('🔴 节点拖拽结束:', { draggingNodeId, dragOverNodeId });
      if (dragOverNodeId && draggingNodeId !== dragOverNodeId) {
        // console.log('🚀 执行节点拖拽换父:', { dragNodeId: draggingNodeId, targetParentId: dragOverNodeId });
        handleNodeDrop(draggingNodeId, dragOverNodeId);
      } else {
        // console.log('❌ 拖拽到同一节点或无目标，取消操作');
      }
      setDraggingNodeId(null);
      setDragOverNodeId(null);
      setDragPreview(null);
      return;
    }
    
    // 结束画布拖拽
    setIsDraggingNode(false);
    isDraggingNodeRef.current = false;
    if (typeof onDraggingChange === 'function') onDraggingChange(false);
    // console.log('🖱️ 画布拖拽结束');
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isReadOnly) return;

    const mousePos = getMousePositionOnCanvas(e);
    const worldPos = screenToWorld(mousePos, viewport);

    // Check if click was on a collapse button first (reverse traversal for topmost)
    function wasCollapseButtonClicked(node: MindMapNode | null): boolean {
      if (!node) return false;
      if (!node.isCollapsed) { // Only check children's buttons if parent is expanded
        for (let i = node.children.length - 1; i >= 0; i--) {
          if (wasCollapseButtonClicked(node.children[i])) return true;
        }
      }
      if (node.children && node.children.length > 0) {
        const buttonCenterX = node.position.x + node.width;
        const buttonCenterY = node.position.y + node.height / 2;
        const distSq = (worldPos.x - buttonCenterX) ** 2 + (worldPos.y - buttonCenterY) ** 2;
        if (distSq <= COLLAPSE_BUTTON_RADIUS ** 2) return true;
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
  const { fitView, centerView, dispatch } = mindMapHookInstance;
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
          // 新增：添加/修改优先级二级菜单
          ...(contextMenu.node && canEditPriority(contextMenu.node, priorityConfig, isReadOnly)
            ? [{
                actions: [
                  {
                    key: (typeof contextMenu.node.priority === 'number') ? 'edit-priority' : 'add-priority',
                    label: (typeof contextMenu.node.priority === 'number') ? '修改优先级' : '添加优先级',
                    onClick: () => {
                      // 默认点击主菜单时，弹出二级菜单，不做任何变更
                    },
                    children: priorityConfig && Array.isArray(priorityConfig.options) ? priorityConfig.options.map(opt => ({
                      key: 'priority-' + opt.value,
                      label: <PriorityLabel label={opt.label} color={opt.color || '#888'} bg={(opt.color ? opt.color + '22' : '#f4f4f7')} />,
                      onClick: () => updateNodePriority(contextMenu.node!.id, opt.value)
                    })) : []
                  }
                ]
              }]
            : []),
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
          },

        ].filter(group => group.actions.length > 0)
        :
        [
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
          const centerCanvas: Point = { x: currentCanvasSize.width / 2, y: currentCanvasSize.height / 2 };
          zoom(-100, centerCanvas);
          e.preventDefault();
        } else if (e.key === '-' || e.key === '_') {
          const centerCanvas: Point = { x: currentCanvasSize.width / 2, y: currentCanvasSize.height / 2 };
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
            // 删除最后一个节点时，弹出提示，后面改用组件
            showMessage({ content: "不能删除最后一个节点。", type: 'warning' });
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

  useEffect(() => {
    if (state.rootNode && !didFitViewRef.current) {
      fitView();
      didFitViewRef.current = true;
    }
  }, [state.rootNode]);

  const nodeToEdit = editingNodeId ? findNodeInAST(rootNode, editingNodeId) : null;

  // 拖拽换父核心逻辑
  function handleNodeDrop(dragNodeId: string, targetParentId: string) {
    // console.log('🎯 开始处理节点拖拽换父:', { dragNodeId, targetParentId });
    if (dragNodeId === targetParentId) {
      // console.log('❌ 拖拽源和目标相同，忽略');
      return;
    }
    const dragNode = findNodeInAST(rootNode, dragNodeId);
    const targetParent = findNodeInAST(rootNode, targetParentId);
    if (!dragNode || !targetParent) {
      // console.log('❌ 找不到拖拽节点或目标父节点:', { dragNode: !!dragNode, targetParent: !!targetParent });
      return;
    }
    // console.log('📋 拖拽节点信息:', { dragNodeText: dragNode.text, dragNodeType: dragNode.nodeType });
    // console.log('📋 目标父节点信息:', { targetParentText: targetParent.text, targetParentType: targetParent.nodeType });
    
    // 业务规则1：前置条件节点不能拖拽换父
    if (dragNode.nodeType === 'preconditionNode') {
      showMessage({ content: '前置条件节点不能通过拖拽换父，只能在用例节点下新建！', type: 'warning' });
      return;
    }
    // 业务规则2：用例节点下只能有一个前置条件节点，且始终在第一个
    if (targetParent.nodeType === 'caseNode' && dragNode.nodeType === 'preconditionNode') {
      const hasPre = targetParent.children.some(child => child.nodeType === 'preconditionNode');
      if (hasPre) {
        showMessage({ content: '用例节点下只能有一个前置条件节点！', type: 'error' });
        return;
      }
      // 只能新建，不能拖拽换父
      showMessage({ content: '前置条件节点只能在用例节点下新建，不能通过拖拽换父！', type: 'warning' });
      return;
    }
    // 外部API优先
    if (typeof canMoveNode === 'function' && !canMoveNode(dragNode, targetParent)) {
      // console.log('❌ 外部API阻止移动');
      showMessage({ content: '不允许移动到该节点下', type: 'error' });
      return;
    }
    // 普通节点可自由移动
    if (!isBuiltinNodeType(dragNode.nodeType)) {
      // console.log('✅ 普通节点，允许自由移动');
      mindMapHookInstance.moveNode?.(String(dragNodeId), String(targetParentId));
      return;
    }
    // 内置类型节点，复用新增节点规则
    const typeConf = BUILTIN_NODE_TYPE_CONFIG[targetParent.nodeType as keyof typeof BUILTIN_NODE_TYPE_CONFIG];
    if (!typeConf) {
      // console.log('❌ 目标节点类型不允许挂载子节点');
      showMessage({ content: '目标节点类型不允许挂载该类型子节点', type: 'error' });
      return;
    }
    const canAddTypes = (typeConf.canAddChildren || []);
    if (!canAddTypes.includes(dragNode.nodeType)) {
      // console.log('❌ 目标节点类型不允许挂载该类型子节点:', { targetType: targetParent.nodeType, dragType: dragNode.nodeType, allowedTypes: canAddTypes });
      message.error({ content: '该类型节点不能移动到目标节点下'});
      return;
    }
    // console.log('✅ 内置类型节点，移动规则检查通过');
    // 可加 maxChildrenOfType 等约束
    mindMapHookInstance.moveNode?.(String(dragNodeId), String(targetParentId));
    // console.log('节点拖拽换父执行完成');
  }

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
          typeConfig={mindMapHookInstance.typeConfig}
          setDynamicWidth={setEditingNodeDynamicWidth}
          priorityConfig={priorityConfig}
        />
      )}
      <MessageBox messages={messages} onClose={removeMessage} />
    </div>
  );
};

export default MindMapCanvas;
