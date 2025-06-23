import { FaPlus } from 'react-icons/fa';
import { Command } from '../types';
import { MindMapState } from '../types';
import { findNodeAndParentInAST } from '../utils/nodeUtils';
import { NEW_NODE_TEXT } from '../constants';

// 添加兄弟节点命令，id 必须为短横线风格并与工具条 key 保持一致
export const addSiblingNodeCommand: Command = {
  id: 'add-sibling-node', // 命令唯一标识符
  label: '添加节点', // 按钮文本
  title: '添加兄弟节点 (Insert)', // 按钮提示
  icon: FaPlus, // 图标
  canExecute: (state: MindMapState) => {
    if (state.isReadOnly || !state.selectedNodeId || !state.rootNode) {
      return false;
    }
    // 根节点不能添加兄弟节点
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