import React from 'react';
import type { SearchWidgetProps } from '../types';
import { CloseIcon } from './icons';

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
        className="px-3 py-1.5 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm w-48 sm:w-64"
        aria-label="搜索思维导图节点"
      />
      <button
        onClick={onClose}
        className="p-1.5 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        title="关闭搜索"
        aria-label="关闭搜索组件"
      >
        <CloseIcon />
      </button>
    </div>
  );
};

export default SearchWidget;