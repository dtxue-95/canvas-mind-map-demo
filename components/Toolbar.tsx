import React from 'react';
import { CommandDescriptor } from '../types';

// 工具栏组件属性
interface ToolbarProps {
  commands: CommandDescriptor[];  // 命令数组
  borderStyle?: 'top' | 'bottom' | 'none'; // 边框样式
}

// 工具栏按钮组件
const ToolbarButton: React.FC<React.PropsWithChildren<{ onClick: () => void; disabled?: boolean; title?: string }>> = ({ onClick, children, disabled, title }) => {
  let baseClasses = "px-4 py-2 mx-1 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400";
  let stateClasses = "";
  if (disabled) {
    stateClasses = "bg-gray-400 cursor-not-allowed";
  } else {
    stateClasses = "bg-blue-500 hover:bg-blue-600 active:bg-blue-700";
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseClasses} ${stateClasses}`}
    >
      {children}
    </button>
  );
};

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
        <ToolbarButton
          key={command.id}
          onClick={command.action}
          disabled={command.disabled}
          title={command.title}
        >
          {command.label}
        </ToolbarButton>
      ))}
    </div>
  );
};

export default Toolbar;
