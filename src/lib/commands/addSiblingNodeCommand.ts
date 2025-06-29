import { FaPlus } from 'react-icons/fa';
import { Command } from '../types';
import { MindMapState, MindMapNode, BUILTIN_NODE_TYPE_CONFIG } from '../types';
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
    // 内置类型同级节点约束
    const findNode = (node: MindMapNode | null, id: string): MindMapNode | null => {
      if (!node) return null;
      if (node.id === id) return node;
      for (const child of node.children || []) {
        const found = findNode(child, id);
        if (found) return found;
      }
      return null;
    };
    const node = findNode(state.rootNode, state.selectedNodeId);
    if (!node) return false;
    const type = node.nodeType;
    // 约束规则
    if (type === 'moduleNode' || type === 'testPointNode' || type === 'caseNode' || type === 'stepNode') {
      return true;
    }
    if (type === 'preconditionNode' || type === 'resultNode') {
      return false;
    }
    // 其他类型默认允许
    return true;
  },
  execute: (state: MindMapState, handlers: { addNode: (text: string, parentId: string | null, nodeType?: string) => void }) => {
    if (!addSiblingNodeCommand.canExecute(state)) return;
    const findNode = (node: MindMapNode | null, id: string): MindMapNode | null => {
      if (!node) return null;
      if (node.id === id) return node;
      for (const child of node.children || []) {
        const found = findNode(child, id);
        if (found) return found;
      }
      return null;
    };
    const node = findNode(state.rootNode, state.selectedNodeId);
    if (!node) return;
    const type = node.nodeType;
    // 找到父节点
    const result = findNodeAndParentInAST(state.rootNode!, state.selectedNodeId!);
    if (!result || !result.parent) return;
    const parentId = result.parent.id as string;
    // 约束规则
    if (type === 'moduleNode') {
      if (parentId) handlers.addNode(NEW_NODE_TEXT, parentId, 'moduleNode');
      return;
    }
    if (type === 'testPointNode') {
      if (parentId) handlers.addNode(NEW_NODE_TEXT, parentId, 'testPointNode');
      return;
    }
    if (type === 'caseNode') {
      if (parentId) handlers.addNode(NEW_NODE_TEXT, parentId, 'caseNode');
      return;
    }
    if (type === 'stepNode') {
      if (parentId) handlers.addNode(NEW_NODE_TEXT, parentId, 'stepNode');
      return;
    }
    // 前置条件节点、预期结果节点不可添加同级
    if (type === 'preconditionNode' || type === 'resultNode') {
      return;
    }
    // 其他类型默认行为
    if (parentId) handlers.addNode(NEW_NODE_TEXT, parentId);
  },
}; 