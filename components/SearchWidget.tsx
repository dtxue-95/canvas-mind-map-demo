import React from 'react';
import { Button, Icon } from '@alifd/next';
import type { SearchWidgetProps } from '../types';

// 搜索组件
const SearchWidget: React.FC<SearchWidgetProps> = ({
  isVisible,
  searchTerm,
  onSearchTermChange,
  onClose,
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 sm:right-6 md:right-8 bg-white p-3 sm:p-4 rounded-lg shadow-xl z-30 flex items-center space-x-2">
      <input
        type="text"
        placeholder="搜索节点..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        aria-label="搜索思维导图节点"
        style={{ 
          width: '220px',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.2s ease'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3b82f6';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db';
        }}
      />
      <Button
        onClick={onClose}
        title="关闭搜索"
        aria-label="关闭搜索组件"
        type="normal"
        text
      >
        <Icon type="close" />
      </Button>
    </div>
  );
};

export default SearchWidget;