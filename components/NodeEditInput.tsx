import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Icon } from '@alifd/next';
import { MindMapNodeAST, Viewport } from '../types'; // Changed Node to MindMapNodeAST
import { worldToScreen } from '../utils/canvasUtils';
import { FONT_SIZE, FONT_FAMILY, TEXT_PADDING_X, TEXT_PADDING_Y, NODE_BORDER_RADIUS } from '../constants';

// Props interface defined in types.ts as NodeEditInputProps
import { NodeEditInputProps } from '../types';

const NodeEditInput: React.FC<NodeEditInputProps> = ({ node, viewport, onSave, onCancel, canvasBounds }) => {
  const [text, setText] = useState(node.text);
  const inputRef = useRef<any>(null); // 使用 any 类型以兼容 @alifd/next 的 ref

  // 根据节点在Canvas中的位置计算输入框的绝对定位
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '8px', // 间距
    };
  })();

  const handleSave = () => {
    onSave(text.trim() || '新想法'); // 保存时不为空
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      // @alifd/next 的 Input 没有 select() 方法，但 focus() 通常足够
    }
  }, []);

  return (
    <div style={style}>
      <Input
        ref={inputRef}
        value={text}
        onChange={(value) => setText(String(value))}
        onKeyDown={handleKeyDown}
        onBlur={handleSave} // 失去焦点时自动保存
        style={{ width: '90%' }}
        aria-label="编辑节点文本"
      />
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button type="primary" onClick={handleSave} size="small">
          <Icon type="success" /> 保存
        </Button>
        <Button onClick={onCancel} size="small">
          <Icon type="close" /> 取消
        </Button>
      </div>
    </div>
  );
};

export default NodeEditInput;