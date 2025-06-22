import React from 'react';
import { Button } from '@alifd/next';
import { CommandDescriptor } from '../types';

// 工具栏组件属性
interface ToolbarProps {
  commands: CommandDescriptor[];  // 命令数组
  borderStyle?: 'top' | 'bottom' | 'none'; // 边框样式
}

// 主工具栏组件
const Toolbar: React.FC<ToolbarProps> = ({ commands, borderStyle = 'bottom' }) => {
  // 获取边框样式类名
  const getBorderClass = () => {
    switch (borderStyle) {
      case 'top':
        return 'border-t border-gray-300';
      case 'bottom':
        return 'border-b border-gray-300';
      case 'none':
        return '';
      default:
        return 'border-b border-gray-300'; // 默认样式
    }
  };

  return (
    <div className={`p-2 bg-gray-100 ${getBorderClass()} shadow-md flex items-center justify-center space-x-2`}>
      {commands.map((command) => (
        <Button
          key={command.id}
          type="primary"
          onClick={command.action}
          disabled={command.disabled}
          title={command.title}
        >
          {command.label}
        </Button>
      ))}
    </div>
  );
};

export default Toolbar;
