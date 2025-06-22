import React from 'react';
import { Input, Button, Icon } from '@alifd/next';
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
      <Input
        placeholder="搜索节点..."
        value={searchTerm}
        onChange={(value) => onSearchTermChange(String(value))}
        aria-label="搜索思维导图节点"
        style={{ width: '220px' }}
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