import { FaUndo } from 'react-icons/fa';
import { Command, MindMapState } from '../types';

// 撤销命令，id 必须为短横线风格并与工具条 key 保持一致
export const undoCommand: Command = {
  id: 'undo', // 命令唯一标识符
  label: '撤销', // 按钮文本
  title: '撤销 (Cmd+Z)', // 按钮提示
  icon: FaUndo, // 图标
  canExecute: (state: MindMapState, canUndo: boolean) => {
    return !state.isReadOnly && canUndo;
  },
  execute: (_state: MindMapState, handlers: { undo: () => void }) => {
    handlers.undo();
  },
}; 