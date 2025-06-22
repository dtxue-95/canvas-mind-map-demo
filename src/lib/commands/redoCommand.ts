import { FaRedo } from 'react-icons/fa';
import { Command, MindMapState } from '../types';

export const redoCommand: Command = {
  id: 'redo',
  label: '重做',
  title: '重做 (Cmd+Shift+Z)',
  icon: FaRedo,
  canExecute: (state: MindMapState, canRedo: boolean) => {
    return !state.isReadOnly && canRedo;
  },
  execute: (state: MindMapState, handlers: { redo: () => void }) => {
    handlers.redo();
  },
}; 