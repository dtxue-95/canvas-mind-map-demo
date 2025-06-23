import { FiZoomOut } from 'react-icons/fi';
import { Command, MindMapState } from '../types';

export const zoomOutCommand: Command = {
  id: 'zoom-out',
  label: '缩小',
  title: '缩小',
  icon: FiZoomOut,
  canExecute: () => {
    return true;
  },
  execute: (_state: MindMapState, handlers: { zoomOut: () => void }) => {
    handlers.zoomOut();
  },
}; 