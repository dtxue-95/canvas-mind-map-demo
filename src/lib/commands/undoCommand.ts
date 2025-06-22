import { FaUndo } from 'react-icons/fa';
import { Command, MindMapState } from '../types';

export const undoCommand: Command = {
  id: 'undo',
  label: '撤销',
  title: '撤销 (Cmd+Z)',
  icon: FaUndo,
  canExecute: (state: MindMapState, canUndo: boolean) => {
    return !state.isReadOnly && canUndo;
  },
  execute: (state: MindMapState, handlers: { undo: () => void }) => {
    handlers.undo();
  },
}; 