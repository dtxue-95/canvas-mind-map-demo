import { FaLock, FaLockOpen } from 'react-icons/fa';
import { Command, MindMapState } from '../types';

export const toggleReadOnlyCommand: Command = {
  id: 'toggle-read-only',
  label: '切换只读',
  title: '切换只读模式',
  icon: FaLock,
  canExecute: () => {
    return true; // Always executable
  },
  execute: (_state: MindMapState, handlers: { toggleReadOnlyMode: () => void }) => {
    handlers.toggleReadOnlyMode();
  },
  getDynamicProps: (state: MindMapState) => ({
    icon: state.isReadOnly ? FaLock : FaLockOpen,
    title: state.isReadOnly ? '切换到编辑模式' : '切换到只读模式',
  }),
}; 