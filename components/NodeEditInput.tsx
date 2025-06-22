import React, { useState, useEffect, useRef } from 'react';
import { MindMapNodeAST, Viewport } from '../types'; // Changed Node to MindMapNodeAST
import { worldToScreen } from '../utils/canvasUtils';
import { FONT_SIZE, FONT_FAMILY, TEXT_PADDING_X, TEXT_PADDING_Y, NODE_BORDER_RADIUS } from '../constants';

// Props interface defined in types.ts as NodeEditInputProps
import { NodeEditInputProps } from '../types';

const NodeEditInput: React.FC<NodeEditInputProps> = ({ node, viewport, onSave, onCancel, canvasBounds }) => {
  const [text, setText] = useState(node.text);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(node.text);
    if (inputRef.current) { // Ensure ref is current before focusing
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [node]); // Rerun if node object changes

  if (!canvasBounds) return null;

  const screenPos = worldToScreen(node.position, viewport);
  // Use node's actual width/height from layout for the input field size
  const screenWidth = node.width * viewport.zoom;
  const screenHeight = node.height * viewport.zoom;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${screenPos.x}px`,
    top: `${screenPos.y}px`,
    width: `${screenWidth}px`,
    height: `${screenHeight}px`,
    fontFamily: FONT_FAMILY,
    fontSize: `${FONT_SIZE * viewport.zoom}px`,
    lineHeight: `${FONT_SIZE * 1.2 * viewport.zoom}px`, // Consistent with canvas text rendering
    color: node.textColor,
    backgroundColor: node.color,
    textAlign: 'center',
    border: 'none', // Or a subtle border for editing
    outline: 'none', // Or focus ring
    boxSizing: 'border-box',
    padding: `${TEXT_PADDING_Y * viewport.zoom}px ${TEXT_PADDING_X * viewport.zoom}px`,
    borderRadius: `${NODE_BORDER_RADIUS * viewport.zoom}px`,
    resize: 'none',
    overflow: 'hidden', // To match node appearance, text should wrap.
    zIndex: 100,
    // Ensure textarea text is vertically centered like canvas text
    display: 'flex',
    alignItems: 'center', 
    justifyContent: 'center',
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave(text.trim() === "" ? "New Idea" : text); // Ensure non-empty text
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBlur = () => {
    onSave(text.trim() === "" ? "New Idea" : text); // Ensure non-empty text
  };

  return (
    <textarea
      ref={inputRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      style={style}
      aria-label="Edit node text"
    />
  );
};

export default NodeEditInput;