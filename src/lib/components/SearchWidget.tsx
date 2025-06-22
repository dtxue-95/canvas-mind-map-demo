import React, { useEffect, useRef } from 'react';
import { FaTimes, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import type { SearchWidgetProps } from '../types';

// 搜索组件
const SearchWidget: React.FC<SearchWidgetProps> = ({
  isVisible,
  searchTerm,
  onSearchTermChange,
  onClose,
  totalMatches,
  currentMatchIndex,
  onNextMatch,
  onPreviousMatch,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible) {
      // 自动聚焦到输入框
      inputRef.current?.focus();
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 阻止 Cmd+F/Ctrl+F 在搜索框内触发浏览器默认行为
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        e.stopPropagation();
    }
  };

  return (
    <div className="fixed top-20 right-4 sm:right-6 md:right-8 bg-white p-2 rounded-lg shadow-xl z-30 flex items-center space-x-2 search-widget">
      <input
        ref={inputRef}
        type="text"
        placeholder="搜索节点..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="
          w-48 py-1.5 px-3 border border-gray-300 rounded-md text-sm 
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none
        "
      />
      <div className="flex items-center space-x-1 text-sm text-gray-600">
        <span>{totalMatches > 0 ? currentMatchIndex + 1 : 0} / {totalMatches}</span>
        <button
          onClick={onPreviousMatch}
          disabled={totalMatches === 0}
          title="上一个匹配"
          className="p-1.5 disabled:text-gray-300 hover:bg-gray-200 rounded-full transition-colors"
        >
          <FaChevronUp />
        </button>
        <button
          onClick={onNextMatch}
          disabled={totalMatches === 0}
          title="下一个匹配"
          className="p-1.5 disabled:text-gray-300 hover:bg-gray-200 rounded-full transition-colors"
        >
          <FaChevronDown />
        </button>
      </div>
      <button
        onClick={onClose}
        title="关闭搜索"
        className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default SearchWidget;