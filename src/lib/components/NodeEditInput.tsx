import React, { useState, useEffect, useRef } from 'react';
import { worldToScreen, calculateNodeDimensions } from '../utils/canvasUtils';
import { NodeEditInputProps, MindMapTypeConfig, PRIORITY_LABELS, NodePriority, MindMapPriorityConfig } from '../types';

const BUILTIN_TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  rootNode: { label: '需求', color: '#8e8e93', bg: '#f4f4f7' },
  moduleNode: { label: '模块', color: '#34c759', bg: '#eafaf1' },
  testPointNode: { label: '测试点', color: '#ff9500', bg: '#fff7e6' },
  caseNode: { label: '用例', color: '#007aff', bg: '#e6f0ff' },
  preconditionNode: { label: '前置条件', color: '#af52de', bg: '#f6eaff' },
  stepNode: { label: '步骤', color: '#32ade6', bg: '#e6faff' },
  resultNode: { label: '预期结果', color: '#ff3b30', bg: '#fff0ef' },
};

function getLabelConfig(nodeType?: string, typeConfig?: MindMapTypeConfig) {
  if (!nodeType) return undefined;
  if (typeConfig && typeConfig.mode === 'custom' && Array.isArray(typeConfig.customTypes)) {
    const custom = typeConfig.customTypes.find((t) => t.type === nodeType);
    if (custom) return { label: custom.label, color: custom.color, bg: custom.color + '22' };
  }
  if (typeConfig && typeConfig.mode === 'builtin' && BUILTIN_TYPE_LABELS[nodeType]) {
    return BUILTIN_TYPE_LABELS[nodeType];
  }
  if (BUILTIN_TYPE_LABELS[nodeType]) return BUILTIN_TYPE_LABELS[nodeType];
  return undefined;
}

const NodeEditInput: React.FC<NodeEditInputProps & { priorityConfig?: MindMapPriorityConfig }> = ({ node, viewport, onSave, onCancel, canvasBounds, typeConfig, setDynamicWidth, priorityConfig }) => {
  const [text, setText] = useState(node.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const labelConfig = getLabelConfig(node.nodeType, typeConfig);
  const priorityConf = typeof node.priority === 'number' && priorityConfig?.enabled ? PRIORITY_LABELS[node.priority as NodePriority] : undefined;

  // 动态计算宽高（随输入内容和标签变化）
  const fontWeight = 'normal';
  const fontSize = 16 * viewport.zoom;
  const fontFamily = 'inherit';
  const { width: dynamicWidth, height: dynamicHeight } = calculateNodeDimensions(text, node.nodeType, typeConfig, node.priority, priorityConfig, fontWeight, fontSize, fontFamily);
  const nodeScreenPos = canvasBounds ? worldToScreen(node.position, viewport) : { x: 0, y: 0 };
  const nodeScreenWidth = dynamicWidth * viewport.zoom;
  const nodeScreenHeight = dynamicHeight * viewport.zoom;

  useEffect(() => {
    if (setDynamicWidth) setDynamicWidth(dynamicWidth);
  }, [dynamicWidth, setDynamicWidth]);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: canvasBounds ? `${canvasBounds.left + nodeScreenPos.x}px` : undefined,
    top: canvasBounds ? `${canvasBounds.top + nodeScreenPos.y}px` : undefined,
    width: `${nodeScreenWidth}px`,
    height: `${nodeScreenHeight}px`,
    background: node.color,
    border: '1px solid #3b82f6',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    outline: '2px solid #3b82f6',
    overflow: 'visible',
    padding: 0,
  };

  const labelStyle: React.CSSProperties = labelConfig ? {
    display: 'inline-flex',
    alignItems: 'center',
    height: `${24 * viewport.zoom}px`,
    borderRadius: `${8 * viewport.zoom}px`,
    background: labelConfig.bg,
    color: labelConfig.color,
    border: `${1.5 * viewport.zoom}px solid ${labelConfig.color}`,
    fontWeight: 500,
    fontSize: `${12 * viewport.zoom}px`,
    padding: `0 ${6 * viewport.zoom}px`,
    marginLeft: `${12 * viewport.zoom}px`,
    marginRight: `${6 * viewport.zoom}px`,
    userSelect: 'none',
    whiteSpace: 'nowrap',
    position: 'relative',
    zIndex: 2,
  } : {};

  const priorityLabelStyle: React.CSSProperties = priorityConf ? {
    display: 'inline-flex',
    alignItems: 'center',
    height: `${24 * viewport.zoom}px`,
    borderRadius: `${8 * viewport.zoom}px`,
    background: priorityConf.bg,
    color: priorityConf.color,
    border: `${1.5 * viewport.zoom}px solid ${priorityConf.color}`,
    fontWeight: 500,
    fontSize: `${12 * viewport.zoom}px`,
    padding: `0 ${6 * viewport.zoom}px`,
    marginLeft: `${6 * viewport.zoom}px`,
    marginRight: `${6 * viewport.zoom}px`,
    userSelect: 'none',
    whiteSpace: 'nowrap',
    position: 'relative',
    zIndex: 2,
  } : {};

  const textareaStyle: React.CSSProperties = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: node.textColor,
    fontSize: `${16 * viewport.zoom}px`,
    fontFamily: 'inherit',
    resize: 'none',
    overflow: 'hidden',
    lineHeight: '1.2',
    padding: `8px 12px 8px 0`,
    minHeight: '24px',
    width: '100%',
    zIndex: 1,
  };

  const handleSave = () => {
    if (text.trim() !== node.text) {
      onSave(text.trim());
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  // 自动高度适应
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [text, nodeScreenWidth]);

  // 聚焦
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      textarea.select();
    }
  }, []);

  return (
    <div style={containerStyle}>
      {labelConfig && (
        <span style={labelStyle}>{labelConfig.label}</span>
      )}
      {priorityConf && (
        <span style={priorityLabelStyle}>{priorityConf.label}</span>
      )}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        style={textareaStyle}
        aria-label="编辑节点文本"
      />
    </div>
  );
};

export default NodeEditInput;