import { FiSearch } from 'react-icons/fi';
import { Command, MindMapState } from '../types';

// 搜索命令，id 必须为短横线风格并与工具条 key 保持一致
export const toggleSearchCommand: Command = {
  id: 'toggle-search', // 命令唯一标识符
  label: '搜索', // 按钮文本
  title: '搜索 (Cmd+F)', // 按钮提示
  icon: FiSearch, // 图标
  canExecute: () => {
    return true;
  },
  execute: (_state: MindMapState, handlers: { toggleSearch: () => void }) => {
    handlers.toggleSearch();
  },
}; 