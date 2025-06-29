import { FaSitemap } from 'react-icons/fa';
import { Command } from '../types';
import { MindMapState, BUILTIN_NODE_TYPE_CONFIG } from '../types';
import { NEW_NODE_TEXT } from '../constants';
import { MindMapNode } from '../types';

// 添加子节点命令，id 必须为短横线风格并与工具条 key 保持一致
export const addChildNodeCommand: Command = {
  id: 'add-child-node', // 命令唯一标识符
  label: '添加子节点', // 按钮文本
  title: '添加子节点 (Tab)', // 按钮提示
  icon: FaSitemap, // 图标
  canExecute: (state: MindMapState) => {
    if (state.isReadOnly || !state.selectedNodeId || !state.rootNode) return false;
    // 限制：只对内置类型做约束
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
    const typeConf = BUILTIN_NODE_TYPE_CONFIG[node.nodeType as keyof typeof BUILTIN_NODE_TYPE_CONFIG];
    if (!typeConf) return true; // 非内置类型不限制
    // 检查是否还有可添加的类型
    const children = node.children || [];
    const canAddTypes = (typeConf.canAddChildren || []).filter((type: string) => {
      const maxMap = (typeConf as any).maxChildrenOfType as Record<string, number> | undefined;
      if (!maxMap || maxMap[type] == null) return true;
      const count = children.filter((c: MindMapNode) => c.nodeType === type).length;
      return count < maxMap[type];
    });
    return canAddTypes.length > 0;
  },
  execute: (state: MindMapState, handlers: { addNode: (text: string, parentId: string | null, nodeType?: string) => void }) => {
    if (!addChildNodeCommand.canExecute(state)) return;
    // 限制：只对内置类型做约束
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
    const typeConf = BUILTIN_NODE_TYPE_CONFIG[node.nodeType as keyof typeof BUILTIN_NODE_TYPE_CONFIG];
    if (!typeConf) {
      // 非内置类型，默认行为
      handlers.addNode(NEW_NODE_TEXT, state.selectedNodeId);
      return;
    }
    const children = node.children || [];
    const canAddTypes = (typeConf.canAddChildren || []).filter((type: string) => {
      const maxMap = (typeConf as any).maxChildrenOfType as Record<string, number> | undefined;
      if (!maxMap || maxMap[type] == null) return true;
      const count = children.filter((c: MindMapNode) => c.nodeType === type).length;
      return count < maxMap[type];
    });
    if (canAddTypes.length === 1) {
      // 只有一种可选类型，直接添加
      handlers.addNode(NEW_NODE_TEXT, state.selectedNodeId, canAddTypes[0]);
    } else if (canAddTypes.length > 1) {
      // 多种类型，后续可弹出类型选择（此处可扩展）
      // 目前默认添加第一种
      handlers.addNode(NEW_NODE_TEXT, state.selectedNodeId, canAddTypes[0]);
    }
  },
}; 