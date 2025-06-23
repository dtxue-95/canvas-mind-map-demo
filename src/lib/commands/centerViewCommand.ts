import { FiCrosshair } from 'react-icons/fi';
import { Command, MindMapState } from '../types';

export const centerViewCommand: Command = {
  id: 'center-view',
  label: '居中',
  title: '居中视图',
  icon: FiCrosshair,
  canExecute: (state: MindMapState) => {
    return !!state.rootNode;
  },
  execute: (_state: MindMapState, handlers: { centerView: () => void }) => {
    handlers.centerView();
  },
}; 