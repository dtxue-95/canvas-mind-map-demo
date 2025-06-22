import { FiSearch } from 'react-icons/fi';
import { Command, MindMapState } from '../types';

export const toggleSearchCommand: Command = {
  id: 'toggle-search',
  label: '搜索',
  title: '搜索 (Cmd+F)',
  icon: FiSearch,
  canExecute: () => {
    return true;
  },
  execute: (state: MindMapState, handlers: { toggleSearch: () => void }) => {
    handlers.toggleSearch();
  },
}; 