import { FiBox } from 'react-icons/fi';
import { Command, MindMapState } from '../types';

export const fitViewCommand: Command = {
  id: 'fit-view',
  label: '适应视图',
  title: '适应视图',
  icon: FiBox,
  canExecute: (state: MindMapState) => {
    return !!state.rootNode;
  },
  execute: (_state: MindMapState, handlers: { fitView: () => void }) => {
    handlers.fitView();
  },
}; 