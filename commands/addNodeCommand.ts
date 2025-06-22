import { MindMapNodeAST, AddNodeCommandArgs, AddNodeCommandResult } from '../types';
import { createNode, findNodeInAST, deepCopyAST } from '../utils/nodeUtils';
import { applyLayout } from '../layoutEngine';
import { NEW_NODE_TEXT, CHILD_H_SPACING } from '../constants';

/**
 * 添加节点命令
 * 负责在思维导图中创建新节点并应用布局
 */
export const AddNodeCommand = {
  /**
   * 执行添加节点操作
   * @param currentRootNode 当前根节点
   * @param args 添加节点参数
   * @returns 添加节点结果
   */
  execute: (
    currentRootNode: MindMapNodeAST | null,
    args: AddNodeCommandArgs
  ): AddNodeCommandResult => {
    const { text: nodeText, targetParentId } = args;
    const newNodeId = crypto.randomUUID();
    
    const workingRootNode = deepCopyAST(currentRootNode);

    // 创建新节点实例
    const newNodeInstance = createNode(
      newNodeId,
      nodeText || NEW_NODE_TEXT
    );

    let newRootAfterAdd: MindMapNodeAST | null = null;

    if (targetParentId && workingRootNode) {
      // 有父节点ID，尝试添加到指定父节点
      const parentNode = findNodeInAST(workingRootNode, targetParentId);
      if (parentNode) {
        parentNode.children.push(newNodeInstance);
        newRootAfterAdd = workingRootNode;
      } else {
        // 提供了父ID但未找到，作为新根节点处理（或处理错误）
        // 目前，如果workingRootNode存在，我们不会以这种方式添加另一个根节点。
        // 这种情况可能需要基于期望的应用行为进行特定处理，以支持多个根节点。
        console.warn(`AddNodeCommand: 未找到ID为 ${targetParentId} 的父节点。如果没有当前根节点，则添加为新根节点。`);
        if (!workingRootNode) {
          newRootAfterAdd = newNodeInstance;
        } else {
             newRootAfterAdd = workingRootNode; // 如果父节点未找到且根节点存在，则不进行更改
        }
      }
    } else {
      // 没有父节点ID，或当前不存在根节点
      if (!workingRootNode) {
        // 这是第一个节点，成为根节点
        newRootAfterAdd = newNodeInstance;
      } else {
        // 尝试为根节点添加兄弟节点或另一个根级节点。
        // 当前的单根结构不直接支持通过AddNodeCommand进行此操作
        // 而无需更复杂的逻辑（例如，创建新的虚拟根节点）。
        // 目前，我们假设如果targetParentId为null且根节点存在，我们不会添加新根节点。
        // 或者，如果策略允许多个根节点，如何定位？
        // 对于此迭代，我们将记录警告，如果根节点已存在且未指定父节点，则不添加。
        console.warn("AddNodeCommand: 未指定父节点ID且根节点已存在。简单添加命令不直接支持添加另一个根节点的操作。");
        newRootAfterAdd = workingRootNode; // 无更改
      }
    }
    
    // 应用布局到新结构
    const laidOutRoot = applyLayout(newRootAfterAdd);
    
    // 如果布局定位了新根节点，如果它刚刚创建，则更新其位置
    if (laidOutRoot && laidOutRoot.id === newNodeId && laidOutRoot.position.x === 0 && laidOutRoot.position.y === 0) {
        if(currentRootNode == null) { // 仅当它是第一个节点时
             // 第一个根节点的默认位置。
             // applyLayout应该处理这个，但作为后备。
            laidOutRoot.position = {x: CHILD_H_SPACING /2, y: 0}
        }
    }

    return {
      rootNode: laidOutRoot,
      newNodeId: newNodeId, // 即使节点未添加到现有树中，也返回ID
    };
  },
};