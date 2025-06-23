import React, { useState, useEffect, useRef } from 'react';
import { worldToScreen } from '../utils/canvasUtils';
import { NodeEditInputProps } from '../types';

const NodeEditInput: React.FC<NodeEditInputProps> = ({ node, viewport, onSave, onCancel, canvasBounds }) => {
  const [text, setText] = useState(node.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dynamically calculate the position and size of the textarea
  const style: React.CSSProperties = (() => {
    if (!canvasBounds) return { display: 'none' };

    const nodeScreenPos = worldToScreen(node.position, viewport);
    const nodeScreenWidth = node.width * viewport.zoom;
    const nodeScreenHeight = node.height * viewport.zoom;

    return {
      position: 'absolute',
      left: `${canvasBounds.left + nodeScreenPos.x}px`,
      top: `${canvasBounds.top + nodeScreenPos.y}px`,
      width: `${nodeScreenWidth}px`,
      height: `${nodeScreenHeight}px`,
      background: node.color,
      border: '1px solid #3b82f6',
      borderRadius: '12px',
      textAlign: 'center',
      color: node.textColor,
      fontSize: `${16 * viewport.zoom}px`,
      fontFamily: 'sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${8 * viewport.zoom}px`,
      boxSizing: 'border-box',
      outline: '2px solid #3b82f6',
      resize: 'none',
      overflow: 'hidden',
      lineHeight: '1.2',
    };
  })();

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

  // Auto-resize textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [text, style.width]); // Re-run when text or width changes

  // Focus and select text on mount
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      textarea.select();
    }
  }, []);

  return (
    <textarea
      ref={textareaRef}
        value={text}
      onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      onBlur={handleSave} // Save on blur
      style={style}
        aria-label="编辑节点文本"
      />
  );
};

export default NodeEditInput;