import { FaPlus } from 'react-icons/fa';
import { Command } from '../types';
import { MindMapState } from '../hooks/useMindMap';
import { findNodeAndParentInAST } from '../utils/nodeUtils';
import { NEW_NODE_TEXT } from '../constants';

export const addSiblingNodeCommand: Command = {
  id: 'add-sibling-node',
  label: '添加节点',
  title: '添加兄弟节点 (Insert)',
  icon: FaPlus,
  canExecute: (state: MindMapState) => {
    if (state.isReadOnly || !state.selectedNodeId || !state.rootNode) {
      return false;
    }
    // Cannot add a sibling to the root node
    if (state.selectedNodeId === state.rootNode.id) {
      return false;
    }
    return true;
  },
  execute: (state: MindMapState, handlers: { addNode: (text: string, parentId: string | null) => void }) => {
    if (!addSiblingNodeCommand.canExecute(state)) return;

    const result = findNodeAndParentInAST(state.rootNode!, state.selectedNodeId!);
    if (result && result.parent) {
      handlers.addNode(NEW_NODE_TEXT, result.parent.id);
    }
  },
}; 