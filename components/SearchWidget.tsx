import React from 'react';
import { FaTimes } from 'react-icons/fa';
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
    <div className="fixed top-20 right-4 sm:right-6 md:right-8 bg-white p-3 sm:p-4 rounded-lg shadow-xl z-30 flex items-center space-x-2 search-widget">
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
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3b82f6';
          e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.4)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db';
          e.target.style.boxShadow = 'none';
        }}
        className="
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        "
      />
      <button
        onClick={onClose}
        title="关闭搜索"
        aria-label="关闭搜索组件"
        className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors duration-200"
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default SearchWidget;