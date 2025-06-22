import { FaTrash } from 'react-icons/fa';
import { Command } from '../types';
import { MindMapState } from '../hooks/useMindMap';

export const deleteNodeCommand: Command = {
  id: 'delete-node',
  label: '删除节点',
  title: '删除节点 (Delete)',
  icon: FaTrash,
  canExecute: (state: MindMapState) => {
    if (state.isReadOnly || !state.selectedNodeId || !state.rootNode) {
      return false;
    }
    // Cannot delete the root node
    return state.selectedNodeId !== state.rootNode.id;
  },
  execute: (state: MindMapState, handlers: { deleteNode: (nodeId: string) => void }) => {
    if (!deleteNodeCommand.canExecute(state) || !state.selectedNodeId) return;
    handlers.deleteNode(state.selectedNodeId);
  },
}; 