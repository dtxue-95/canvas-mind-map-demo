import { FaExpand } from 'react-icons/fa';
import { Command, MindMapState } from '../types';

function setAllNodesCollapse(node: any, collapse: boolean) {
  node.isCollapsed = collapse;
  if (node.children && node.children.length > 0) {
    node.children.forEach((child: any) => setAllNodesCollapse(child, collapse));
  }
}

export const expandAllCommand: Command = {
  id: 'expand-all',
  label: '展开所有节点',
  title: '展开所有节点',
  icon: FaExpand,
  canExecute: (state: MindMapState) => {
    if (!state.rootNode) return false;
    // 只要有节点是折叠的就可用
    function hasCollapsed(node: any): boolean {
      if (node.isCollapsed) return true;
      return node.children?.some(hasCollapsed);
    }
    return hasCollapsed(state.rootNode);
  },
  execute: (state: MindMapState, handlers: { dispatch: Function }) => {
    if (!state.rootNode) return;
    const newRoot = JSON.parse(JSON.stringify(state.rootNode));
    setAllNodesCollapse(newRoot, false);
    handlers.dispatch({ type: 'LOAD_DATA', payload: { rootNode: newRoot } });
  },
}; 