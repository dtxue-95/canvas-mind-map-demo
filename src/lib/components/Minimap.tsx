import React, { useRef, useEffect, useState } from 'react';
import { MindMapNode, Viewport } from '../types';

interface MinimapProps {
  rootNode: MindMapNode;
  viewport: Viewport;
  canvasSize: { width: number; height: number };
  onViewportChange: (newViewport: Viewport) => void;
  getNodeStyle?: (node: MindMapNode) => React.CSSProperties;
}

// 递归获取所有节点的包围盒
function getMindMapBoundingBox(node: MindMapNode, box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }) {
  if (!node) return box;
  box.minX = Math.min(box.minX, node.position.x);
  box.minY = Math.min(box.minY, node.position.y);
  box.maxX = Math.max(box.maxX, node.position.x + node.width);
  box.maxY = Math.max(box.maxY, node.position.y + node.height);
  if (node.children && !node.isCollapsed) {
    for (const child of node.children) {
      getMindMapBoundingBox(child, box);
    }
  }
  return box;
}

const MINIMAP_WIDTH = 180;
const MINIMAP_HEIGHT = 120;
const MINIMAP_PADDING = 8;
const MINIMAP_RESOLUTION = 2; // 2x 分辨率抗锯齿
const NODE_BORDER_RADIUS = 4;

const Minimap: React.FC<MinimapProps> = ({ rootNode, viewport, canvasSize, onViewportChange, getNodeStyle }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{dx: number, dy: number} | null>(null);

  // 递归收集所有选中节点id（主视图可传入 selectedNodeId，或遍历 node.selected）
  function collectSelectedIds(node: MindMapNode, ids: Set<string>) {
    if ((node as any).selected) ids.add(node.id);
    if (node.children && !node.isCollapsed) {
      for (const child of node.children) collectSelectedIds(child, ids);
    }
  }
  const selectedIds = new Set<string>();
  collectSelectedIds(rootNode, selectedIds);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rootNode) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // 2x 分辨率抗锯齿
    canvas.width = MINIMAP_WIDTH * MINIMAP_RESOLUTION;
    canvas.height = MINIMAP_HEIGHT * MINIMAP_RESOLUTION;
    canvas.style.width = `${MINIMAP_WIDTH}px`;
    canvas.style.height = `${MINIMAP_HEIGHT}px`;
    ctx.setTransform(MINIMAP_RESOLUTION, 0, 0, MINIMAP_RESOLUTION, 0, 0);
    ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // 绘制半透明白色背景+阴影
    ctx!.save();
    ctx!.globalAlpha = 0.92;
    ctx!.fillStyle = '#fff';
    ctx!.shadowColor = 'rgba(0,0,0,0.08)';
    ctx!.shadowBlur = 8;
    ctx!.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);
    ctx!.restore();

    // 计算思维导图整体包围盒
    const box = getMindMapBoundingBox(rootNode);
    const mapWidth = box.maxX - box.minX;
    const mapHeight = box.maxY - box.minY;
    const scale = Math.min(
      (MINIMAP_WIDTH - MINIMAP_PADDING * 2) / mapWidth,
      (MINIMAP_HEIGHT - MINIMAP_PADDING * 2) / mapHeight,
    );
    const offsetX = MINIMAP_PADDING - box.minX * scale + (MINIMAP_WIDTH - mapWidth * scale) / 2;
    const offsetY = MINIMAP_PADDING - box.minY * scale + (MINIMAP_HEIGHT - mapHeight * scale) / 2;

    // 递归绘制所有节点（圆角矩形，支持 minimapColor/type/选中高亮）
    function drawNodeMini(node: MindMapNode) {
      const style = { background: '#fff', border: '1px solid #e5e7eb', ...(getNodeStyle ? getNodeStyle(node) : {}), ...(node.style || {}) };
      // 优先 minimapColor 作为缩略图节点色
      const fillColor = (style as any).minimapColor || style.background || '#fff';
      const borderColor = selectedIds.has(node.id) ? '#3b82f6' : (typeof style.border === 'string' && style.border.split(' ').pop()) || '#e5e7eb';
      ctx!.save();
      ctx!.globalAlpha = 0.95;
      ctx!.beginPath();
      const x = node.position.x * scale + offsetX;
      const y = node.position.y * scale + offsetY;
      const w = node.width * scale;
      const h = node.height * scale;
      // 圆角矩形
      ctx!.moveTo(x + NODE_BORDER_RADIUS, y);
      ctx!.lineTo(x + w - NODE_BORDER_RADIUS, y);
      ctx!.quadraticCurveTo(x + w, y, x + w, y + NODE_BORDER_RADIUS);
      ctx!.lineTo(x + w, y + h - NODE_BORDER_RADIUS);
      ctx!.quadraticCurveTo(x + w, y + h, x + w - NODE_BORDER_RADIUS, y + h);
      ctx!.lineTo(x + NODE_BORDER_RADIUS, y + h);
      ctx!.quadraticCurveTo(x, y + h, x, y + h - NODE_BORDER_RADIUS);
      ctx!.lineTo(x, y + NODE_BORDER_RADIUS);
      ctx!.quadraticCurveTo(x, y, x + NODE_BORDER_RADIUS, y);
      ctx!.closePath();
      ctx!.fillStyle = typeof fillColor === 'string' ? fillColor : '#fff';
      ctx!.fill();
      ctx!.globalAlpha = 1;
      ctx!.strokeStyle = borderColor;
      ctx!.lineWidth = selectedIds.has(node.id) ? 2 : 1;
      ctx!.stroke();
      ctx!.restore();
      if (node.children && !node.isCollapsed) {
        for (const child of node.children) drawNodeMini(child);
      }
    }
    drawNodeMini(rootNode);

    // 绘制主视图窗口高亮框+半透明遮罩
    ctx!.save();
    // 遮罩
    ctx!.globalAlpha = 0.18;
    ctx!.fillStyle = '#fff';
    ctx!.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);
    ctx!.globalAlpha = 1;
    // 视口框
    ctx!.strokeStyle = '#34d399'; // Tailwind green-400
    ctx!.lineWidth = 2;
    ctx!.setLineDash([4, 2]);
    // 视口框坐标裁剪，保证始终在小地图内，且始终有 MINIMAP_PADDING 间距
    let viewX = (-viewport.x / viewport.zoom - box.minX) * scale + offsetX;
    let viewY = (-viewport.y / viewport.zoom - box.minY) * scale + offsetY;
    let viewW = canvasSize.width / viewport.zoom * scale;
    let viewH = canvasSize.height / viewport.zoom * scale;
    // 保证与小地图四周有 MINIMAP_PADDING 间距
    const minX = MINIMAP_PADDING;
    const minY = MINIMAP_PADDING;
    const maxX = MINIMAP_WIDTH - MINIMAP_PADDING;
    const maxY = MINIMAP_HEIGHT - MINIMAP_PADDING;
    if (viewX < minX) { viewW -= (minX - viewX); viewX = minX; }
    if (viewY < minY) { viewH -= (minY - viewY); viewY = minY; }
    if (viewX + viewW > maxX) viewW = maxX - viewX;
    if (viewY + viewH > maxY) viewH = maxY - viewY;
    ctx!.strokeRect(viewX, viewY, Math.max(0, viewW), Math.max(0, viewH));
    ctx!.restore();
  }, [rootNode, viewport, canvasSize, getNodeStyle]);

  // 拖拽交互：pointerdown 开始拖拽，pointermove 实时同步主视图，pointerup 结束
  function getBoxAndScale() {
    const box = getMindMapBoundingBox(rootNode);
    const mapWidth = box.maxX - box.minX;
    const mapHeight = box.maxY - box.minY;
    const scale = Math.min(
      (MINIMAP_WIDTH - MINIMAP_PADDING * 2) / mapWidth,
      (MINIMAP_HEIGHT - MINIMAP_PADDING * 2) / mapHeight,
    );
    const offsetX = MINIMAP_PADDING - box.minX * scale + (MINIMAP_WIDTH - mapWidth * scale) / 2;
    const offsetY = MINIMAP_PADDING - box.minY * scale + (MINIMAP_HEIGHT - mapHeight * scale) / 2;
    return { box, scale, offsetX, offsetY };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    const { box, scale, offsetX, offsetY } = getBoxAndScale();
    // 计算当前视口框
    const viewX = (-viewport.x / viewport.zoom - box.minX) * scale + offsetX;
    const viewY = (-viewport.y / viewport.zoom - box.minY) * scale + offsetY;
    const viewW = canvasSize.width / viewport.zoom * scale;
    const viewH = canvasSize.height / viewport.zoom * scale;
    // 判断是否点在蓝色框内，支持拖拽
    if (x >= viewX && x <= viewX + viewW && y >= viewY && y <= viewY + viewH) {
      setIsDragging(true);
      setDragOffset({ dx: x - viewX, dy: y - viewY });
    } else {
      // 点在其他区域，直接跳转
      handlePointerMove(e, true);
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>, jump = false) {
    if (!isDragging && !jump) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    const { box, scale, offsetX, offsetY } = getBoxAndScale();
    // 反推世界坐标
    const worldX = (x - (dragOffset?.dx ?? 0) - offsetX) / scale + box.minX;
    const worldY = (y - (dragOffset?.dy ?? 0) - offsetY) / scale + box.minY;
    // 计算新的 viewport，使点击/拖拽点居中
    const newX = canvasSize.width / 2 - worldX * viewport.zoom;
    const newY = canvasSize.height / 2 - worldY * viewport.zoom;
    // 实时同步主视图
    onViewportChange({ ...viewport, x: newX, y: newY });
  }

  function handlePointerUp() {
    setIsDragging(false);
    setDragOffset(null);
  }

  useEffect(() => {
    if (!isDragging) return;
    const handle = (e: PointerEvent) => {
      // 仅主按钮
      if (e.buttons !== 1) { handlePointerUp(); return; }
      // 伪造 React 事件对象
      const fakeEvent = {
        clientX: e.clientX,
        clientY: e.clientY,
        currentTarget: canvasRef.current!,
        preventDefault: () => {},
      } as unknown as React.PointerEvent<HTMLCanvasElement>;
      handlePointerMove(fakeEvent);
    };
    window.addEventListener('pointermove', handle);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handle);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, dragOffset, viewport, canvasSize]);

  return (
    <div style={{
      position: 'absolute',
      right: 16,
      bottom: 16,
      width: MINIMAP_WIDTH,
      height: MINIMAP_HEIGHT,
      background: 'transparent',
      border: 'none',
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      zIndex: 10,
      userSelect: 'none',
      cursor: isDragging ? 'grabbing' : 'pointer',
      transition: 'box-shadow 0.2s',
    }}>
      <canvas
        ref={canvasRef}
        width={MINIMAP_WIDTH * MINIMAP_RESOLUTION}
        height={MINIMAP_HEIGHT * MINIMAP_RESOLUTION}
        style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT, display: 'block', borderRadius: 8 }}
        onPointerDown={handlePointerDown}
        onPointerMove={isDragging ? handlePointerMove : undefined}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
};

export default Minimap; 