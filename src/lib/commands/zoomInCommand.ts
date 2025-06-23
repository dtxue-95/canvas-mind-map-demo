import { FiZoomIn } from 'react-icons/fi';
import { Command, MindMapState } from '../types';

export const zoomInCommand: Command = {
  id: 'zoom-in',
  label: '放大',
  title: '放大',
  icon: FiZoomIn,
  canExecute: () => {
    return true;
  },
  execute: (_state: MindMapState, handlers: { zoomIn: () => void }) => {
    handlers.zoomIn();
  },
}; 