import { FiMaximize } from 'react-icons/fi';
import { Command, MindMapState } from '../types';

export const toggleFullscreenCommand: Command = {
  id: 'toggle-fullscreen',
  label: '全屏',
  title: '切换全屏',
  icon: FiMaximize,
  canExecute: () => true,
  execute: (_state: MindMapState, handlers: { toggleFullscreen: () => void }) => {
    handlers.toggleFullscreen();
  },
}; 