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

const Minimap: React.FC<MinimapProps> = ({ rootNode, viewport, canvasSize, onViewportChange, getNodeStyle }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{dx: number, dy: number} | null>(null);
  const [targetViewport, setTargetViewport] = useState<Viewport | null>(null); // 用于动画过渡

  // requestAnimationFrame 平滑动画
  useEffect(() => {
    if (!targetViewport) return;
    let raf: number;
    function animate() {
      if (!targetViewport) return; // 防止 targetViewport 为 null
      // 线性插值动画
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const t = 0.25; // 动画速度
      const newX = lerp(viewport.x, targetViewport.x, t);
      const newY = lerp(viewport.y, targetViewport.y, t);
      if (Math.abs(newX - targetViewport.x) < 1 && Math.abs(newY - targetViewport.y) < 1) {
        onViewportChange(targetViewport);
        setTargetViewport(null);
        return;
      }
      onViewportChange({ ...viewport, x: newX, y: newY });
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [targetViewport, viewport, onViewportChange]);

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

    // 递归绘制所有节点
    function drawNodeMini(node: MindMapNode) {
      const style = { background: '#fff', border: '1px solid #bbb', ...(getNodeStyle ? getNodeStyle(node) : {}), ...(node.style || {}) };
      ctx!.save();
      ctx!.fillStyle = typeof style.background === 'string' ? style.background : '#fff';
      ctx!.strokeStyle = (typeof style.border === 'string' && style.border.split(' ').pop()) || '#bbb';
      ctx!.globalAlpha = 0.85;
      ctx!.beginPath();
      ctx!.rect(
        (node.position.x) * scale + offsetX,
        (node.position.y) * scale + offsetY,
        node.width * scale,
        node.height * scale
      );
      ctx!.fill();
      ctx!.globalAlpha = 1;
      ctx!.stroke();
      ctx!.restore();
      if (node.children && !node.isCollapsed) {
        for (const child of node.children) drawNodeMini(child);
      }
    }
    drawNodeMini(rootNode);

    // 绘制主视图窗口高亮框
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 2]);
    // 计算主视图窗口在缩略图中的位置
    const viewX = (-viewport.x / viewport.zoom - box.minX) * scale + offsetX;
    const viewY = (-viewport.y / viewport.zoom - box.minY) * scale + offsetY;
    const viewW = canvasSize.width / viewport.zoom * scale;
    const viewH = canvasSize.height / viewport.zoom * scale;
    ctx.strokeRect(viewX, viewY, viewW, viewH);
    ctx.restore();
  }, [rootNode, viewport, canvasSize, getNodeStyle]);

  // 拖拽交互：pointerdown 开始拖拽，pointermove 实时更新，pointerup 结束
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
    // 动画过渡
    setTargetViewport({ ...viewport, x: newX, y: newY });
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
      background: 'rgba(255,255,255,0.85)',
      border: '1px solid #e5e7eb',
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
      />
    </div>
  );
};

export default Minimap; 