import { MindMapNodeAST, DeleteNodeCommandArgs, DeleteNodeCommandResult } from '../types';
import { findNodeAndParentInAST, deepCopyAST, findNodeInAST } from '../utils/nodeUtils';
import { applyLayout } from '../layoutEngine';

/**
 * 删除节点命令
 * 负责从思维导图中删除指定节点及其所有子节点
 */
export const DeleteNodeCommand = {
  /**
   * 执行删除节点操作
   * @param currentRootNode 当前根节点
   * @param args 删除节点参数
   * @returns 删除节点结果
   */
  execute: (
    currentRootNode: MindMapNodeAST | null,
    args: DeleteNodeCommandArgs
  ): DeleteNodeCommandResult => {
    const { nodeIdToDelete } = args;
    
    // 验证输入参数
    if (!nodeIdToDelete || !currentRootNode) {
      return {
        rootNode: currentRootNode,
        newSelectedNodeId: currentRootNode ? currentRootNode.id : null, 
        deletedNodeIds: new Set(),
      };
    }

    const workingRootNode = deepCopyAST(currentRootNode);
    if (!workingRootNode) { // 如果currentRootNode不为null，这不应该发生
        return {
            rootNode: currentRootNode,
            newSelectedNodeId: currentRootNode ? currentRootNode.id : null,
            deletedNodeIds: new Set(),
        };
    }

    // 查找要删除的节点及其父节点
    const findResult = findNodeAndParentInAST(workingRootNode, nodeIdToDelete);

    if (!findResult) {
      return { // 未找到要删除的节点
        rootNode: currentRootNode,
        newSelectedNodeId: workingRootNode.id, // 如果节点未找到，选择根节点
        deletedNodeIds: new Set(),
      };
    }

    const { node: nodeToDeleteInstance, parent: parentOfDeleted } = findResult;
    const deletedNodeIds = new Set<string>();

    // 收集要删除的节点及其所有子节点的ID
    function collectIds(node: MindMapNodeAST) {
      deletedNodeIds.add(node.id);
      node.children.forEach(collectIds);
    }
    collectIds(nodeToDeleteInstance);

    let newRootAfterDelete: MindMapNodeAST | null = workingRootNode;
    let newSelectedNodeId: string | null = null;

    if (parentOfDeleted) {
      // 从父节点的子节点列表中移除要删除的节点
      parentOfDeleted.children = parentOfDeleted.children.filter(child => child.id !== nodeIdToDelete);
      newSelectedNodeId = parentOfDeleted.id;
    } else if (workingRootNode && workingRootNode.id === nodeIdToDelete) {
      // 删除根节点
      // 如果根节点有子节点，提升第一个子节点作为新的根节点
      if (workingRootNode.children && workingRootNode.children.length > 0) {
        newRootAfterDelete = workingRootNode.children[0];
        newSelectedNodeId = newRootAfterDelete.id;
      } else {
        // 如果根节点没有子节点，保留根节点（不允许删除最后一个节点）
        newRootAfterDelete = workingRootNode;
        newSelectedNodeId = workingRootNode.id;
      }
    } else {
      // 以不允许删除的方式未找到节点（例如，不是根节点，但没有父节点）- 在有效的AST中不应该发生
      // 本质上恢复到原始状态
      return { rootNode: currentRootNode, newSelectedNodeId: currentRootNode.id, deletedNodeIds: new Set() };
    }
    
    // 应用布局到删除后的结构
    const laidOutRoot = applyLayout(newRootAfterDelete);

    // 如果没有根节点剩余，newSelectedNodeId必须为null
    if (!laidOutRoot) {
        newSelectedNodeId = null;
    } else if (newSelectedNodeId && !findNodeInAST(laidOutRoot, newSelectedNodeId)) {
        // 如果父节点也被删除了（使用当前逻辑不可能，但防御性）
        // 或者如果原本打算选择的节点消失了，选择新的根节点。
        newSelectedNodeId = laidOutRoot.id;
    } else if (!newSelectedNodeId && laidOutRoot) {
        // 如果由于某种原因newSelectedNodeId变为null但仍有根节点
        newSelectedNodeId = laidOutRoot.id;
    }

    return {
      rootNode: laidOutRoot,
      newSelectedNodeId: newSelectedNodeId,
      deletedNodeIds,
    };
  },
};
