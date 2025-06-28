import { FaCompress } from 'react-icons/fa';
import { Command, MindMapState } from '../types';
import { deepCopyAST } from '../utils/nodeUtils';

function setAllNodesCollapse(node: any, collapse: boolean) {
  node.isCollapsed = collapse;
  if (node.children && node.children.length > 0) {
    node.children.forEach((child: any) => setAllNodesCollapse(child, collapse));
  }
}

export const collapseAllCommand: Command = {
  id: 'collapse-all',
  label: '收起所有节点',
  title: '收起所有节点',
  icon: FaCompress,
  canExecute: (state: MindMapState) => {
    if (!state.rootNode) return false;
    // 只要有节点是展开的就可用
    function hasExpanded(node: any): boolean {
      if (!node.isCollapsed && node.children && node.children.length > 0) return true;
      return node.children?.some(hasExpanded);
    }
    return hasExpanded(state.rootNode);
  },
  execute: (state: MindMapState, handlers: { dispatch: Function }) => {
    if (!state.rootNode) return;
    const newRoot = deepCopyAST(state.rootNode);
    setAllNodesCollapse(newRoot, true);
    handlers.dispatch({ type: 'LOAD_DATA', payload: { rootNode: newRoot } });
  },
}; 