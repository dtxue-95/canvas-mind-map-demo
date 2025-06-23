import { FaTrash } from 'react-icons/fa';
import { Command, MindMapState } from '../types';

// 删除节点命令，id 必须为短横线风格并与工具条 key 保持一致
export const deleteNodeCommand: Command = {
  id: 'delete-node', // 命令唯一标识符
  label: '删除节点', // 按钮文本
  title: '删除节点 (Delete)', // 按钮提示
  icon: FaTrash, // 图标
  canExecute: (state: MindMapState) => {
    if (state.isReadOnly || !state.selectedNodeId || !state.rootNode) {
      return false;
    }
    // 根节点不能被删除
    return state.selectedNodeId !== state.rootNode.id;
  },
  execute: (state: MindMapState, handlers: { deleteNode: (nodeId: string) => void }) => {
    if (!deleteNodeCommand.canExecute(state) || !state.selectedNodeId) return;
    handlers.deleteNode(state.selectedNodeId);
  },
}; 