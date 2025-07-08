import { MindMapNode } from './types';
import { CHILD_V_SPACING, CHILD_H_SPACING } from './constants';
import { calculateNodeDimensions } from './utils/canvasUtils';
import { deepCopyAST } from './utils/nodeUtils'; // 用于 applyLayout 操作副本

/**
 * 根据节点文本获取动态尺寸
 */
function _getNodeDimensions(node: MindMapNode, typeConfig?: any, priorityConfig?: any): { width: number; height: number } {
  // console.log('[layoutEngine:_getNodeDimensions] priorityConfig:', priorityConfig);
  return calculateNodeDimensions(node.text, node.nodeType, typeConfig, node.priority, priorityConfig);
}

/**
 * 递归计算分支的总垂直高度
 * 使用提供的AST节点本身的文本
 */
function getBranchActualHeight(
  node: MindMapNode, // 节点（来自可能修改过的AST，如果尺寸发生变化）
  typeConfig?: any,
  priorityConfig?: any
): number {
  // console.log('[layoutEngine:getBranchActualHeight] priorityConfig:', priorityConfig);
  // 根据节点当前文本获取尺寸
  const { height: nodeHeight } = _getNodeDimensions(node, typeConfig, priorityConfig);

  if (node.isCollapsed) {
    return nodeHeight;
  }

  if (!node.children || node.children.length === 0) {
    return nodeHeight;
  }

  let childrenColumnStackedHeight = 0;
  for (let i = 0; i < node.children.length; i++) {
    const childNode = node.children[i];
    childrenColumnStackedHeight += getBranchActualHeight(childNode, typeConfig, priorityConfig);
    if (i < node.children.length - 1) {
      childrenColumnStackedHeight += CHILD_V_SPACING;
    }
  }
  
  return Math.max(nodeHeight, childrenColumnStackedHeight);
}

/**
 * 递归布局子树。更新节点的位置、宽度和高度。
 */
function _layoutSubtreeRecursive(
  nodeToLayout: MindMapNode, // 来自复制的AST的节点
  currentX: number,
  anchorY: number,
  typeConfig?: any,
  priorityConfig?: any
): number { // 返回布局分支的实际高度
  // console.log('[layoutEngine:_layoutSubtreeRecursive] priorityConfig:', priorityConfig);
  // 根据节点文本更新 nodeToLayout 实例中的尺寸
  const { width: calculatedWidth, height: calculatedHeight } = _getNodeDimensions(nodeToLayout, typeConfig, priorityConfig);
  nodeToLayout.width = calculatedWidth;
  nodeToLayout.height = calculatedHeight;
  
  const nodeHeight = nodeToLayout.height;

  let childrenColumnTotalHeight = 0;
  const childBranchActualHeights: number[] = [];

  if (!nodeToLayout.isCollapsed && nodeToLayout.children && nodeToLayout.children.length > 0) {
    for (const child of nodeToLayout.children) {
      childBranchActualHeights.push(getBranchActualHeight(child, typeConfig, priorityConfig)); // 使用当前（复制的）AST中的子节点
    }
    childrenColumnTotalHeight = childBranchActualHeights.reduce((sum, h) => sum + h, 0) +
                               (nodeToLayout.children.length > 0 ? (nodeToLayout.children.length - 1) * CHILD_V_SPACING : 0);
  }

  let parentFinalY: number;
  let childrenColumnFinalStartY: number;

  if (nodeHeight >= childrenColumnTotalHeight) {
    parentFinalY = anchorY;
    childrenColumnFinalStartY = anchorY + (nodeHeight / 2) - (childrenColumnTotalHeight / 2);
  } else {
    childrenColumnFinalStartY = anchorY;
    parentFinalY = anchorY + (childrenColumnTotalHeight / 2) - (nodeHeight / 2);
  }

  nodeToLayout.position = { x: currentX, y: parentFinalY };

  if (!nodeToLayout.isCollapsed && nodeToLayout.children && nodeToLayout.children.length > 0) {
    const childStartX = currentX + nodeToLayout.width + CHILD_H_SPACING;
    let currentChildOffsetYInColumn = 0;

    for (let i = 0; i < nodeToLayout.children.length; i++) {
      const childNode = nodeToLayout.children[i];
      const childAnchorY = childrenColumnFinalStartY + currentChildOffsetYInColumn;
      
      _layoutSubtreeRecursive(childNode, childStartX, childAnchorY, typeConfig, priorityConfig); // 传递复制的AST中的子节点
      
      currentChildOffsetYInColumn += childBranchActualHeights[i] + CHILD_V_SPACING;
    }
  }
  return Math.max(nodeHeight, childrenColumnTotalHeight);
}

/**
 * 应用布局算法到思维导图
 * @param originalRootNode 原始根节点
 * @param typeConfig 类型配置
 * @param priorityConfig 优先级标签配置
 * @returns 布局后的根节点副本
 */
export function applyLayout(
  originalRootNode: MindMapNode | null,
  typeConfig?: any,
  priorityConfig?: any
): MindMapNode | null {
  // console.log('[layoutEngine:applyLayout] priorityConfig:', priorityConfig);
  if (!originalRootNode) {
    return null;
  }
  
  // 操作深拷贝以避免直接修改原始状态
  const rootNodeCopy = deepCopyAST(originalRootNode);
  if(!rootNodeCopy) return null; // 如果 originalRootNode 不为空，这不应该发生

  // 布局操作的初始位置
  // 整个地图的根节点将有效地由这些默认值定位
  const startX = CHILD_H_SPACING / 2; 
  const startY = 0; 
  
  _layoutSubtreeRecursive(rootNodeCopy, startX, startY, typeConfig, priorityConfig);
  
  return rootNodeCopy;
}