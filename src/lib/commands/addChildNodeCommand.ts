import { FaSitemap } from 'react-icons/fa';
import { Command } from '../types';
import { MindMapState } from '../hooks/useMindMap';
import { NEW_NODE_TEXT } from '../constants';

export const addChildNodeCommand: Command = {
  id: 'add-child-node',
  label: '添加子节点',
  title: '添加子节点 (Tab)',
  icon: FaSitemap,
  canExecute: (state: MindMapState) => {
    return !state.isReadOnly && !!state.selectedNodeId;
  },
  execute: (state: MindMapState, handlers: { addNode: (text: string, parentId: string | null) => void }) => {
    if (!addChildNodeCommand.canExecute(state)) return;
    handlers.addNode(NEW_NODE_TEXT, state.selectedNodeId);
  },
}; 