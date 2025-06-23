import { FaSitemap } from 'react-icons/fa';
import { Command } from '../types';
import { MindMapState } from '../types';
import { NEW_NODE_TEXT } from '../constants';

// 添加子节点命令，id 必须为短横线风格并与工具条 key 保持一致
export const addChildNodeCommand: Command = {
  id: 'add-child-node', // 命令唯一标识符
  label: '添加子节点', // 按钮文本
  title: '添加子节点 (Tab)', // 按钮提示
  icon: FaSitemap, // 图标
  canExecute: (state: MindMapState) => {
    return !state.isReadOnly && !!state.selectedNodeId;
  },
  execute: (state: MindMapState, handlers: { addNode: (text: string, parentId: string | null) => void }) => {
    if (!addChildNodeCommand.canExecute(state)) return;
    handlers.addNode(NEW_NODE_TEXT, state.selectedNodeId);
  },
}; 