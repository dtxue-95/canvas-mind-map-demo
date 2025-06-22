import { MindMapNodeAST } from '../types';
import { NODE_DEFAULT_COLOR, NODE_TEXT_COLOR } from '../constants';

/**
 * 创建新节点
 * @param id 节点唯一标识符
 * @param text 节点文本内容
 * @returns 新创建的节点
 */
export function createNode(id: string, text: string): MindMapNodeAST {
  return {
    id,
    text,
    position: { x: 0, y: 0 }, // 占位符，将由布局引擎更新
    width: 0, // 占位符，将由布局引擎更新
    height: 0, // 占位符，将由布局引擎更新
    color: NODE_DEFAULT_COLOR,
    textColor: NODE_TEXT_COLOR,
    children: [], 
    isCollapsed: false,
    childrenCount: 0,
  };
}

/**
 * 计算节点的所有后代数量
 * @param node 要计算的节点
 * @returns 后代节点总数
 */
export function countAllDescendants(node: MindMapNodeAST | null): number {
  if (!node || !node.children || node.children.length === 0) {
    return 0;
  }

  let count = node.children.length; // 计算直接子节点
  for (const child of node.children) {
    // 仅在此计算上下文中，如果子节点本身未折叠，则计算子节点的后代
    // 这意味着我们计算如果此'节点'展开时*将*可见的所有节点
    count += countAllDescendants(child); // 递归计算每个子节点的后代
  }
  return count;
}

/**
 * 深度复制AST节点树
 * @param node 要复制的根节点
 * @returns 复制的节点树副本
 */
export function deepCopyAST(node: MindMapNodeAST | null): MindMapNodeAST | null {
  if (!node) {
    return null;
  }

  const copiedNode: MindMapNodeAST = {
    ...node, // 复制基本属性
    position: { ...node.position }, // 深度复制位置
    // 递归复制子节点
    children: node.children ? node.children.map(child => deepCopyAST(child)!) : [],
  };
  // 过滤掉空值（如果任何子节点的 deepCopyAST 返回 null，虽然如果子节点有效则不应该发生）
  copiedNode.children = copiedNode.children.filter(child => child !== null);
  
  return copiedNode;
}

/**
 * 在AST中查找指定ID的节点
 * @param rootNode 根节点
 * @param nodeId 要查找的节点ID
 * @returns 找到的节点或null
 */
export function findNodeInAST(rootNode: MindMapNodeAST | null, nodeId: string): MindMapNodeAST | null {
  if (!rootNode) {
    return null;
  }
  if (rootNode.id === nodeId) {
    return rootNode;
  }
  if (rootNode.children) {
    for (const child of rootNode.children) {
      const found = findNodeInAST(child, nodeId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * 在AST中查找指定ID的节点及其父节点
 * @param current 当前节点
 * @param nodeId 要查找的节点ID
 * @param parent 父节点（递归参数）
 * @returns 包含节点和父节点的对象，或null
 */
export function findNodeAndParentInAST(
  current: MindMapNodeAST | null,
  nodeId: string,
  parent: MindMapNodeAST | null = null
): { node: MindMapNodeAST; parent: MindMapNodeAST | null } | null {
  if (!current) {
    return null;
  }
  if (current.id === nodeId) {
    return { node: current, parent };
  }
  if (current.children) {
    for (const child of current.children) {
      const found = findNodeAndParentInAST(child, nodeId, current);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * 将任意数据结构的节点转换为项目所需的 MindMapNodeAST 格式。
 * - 递归处理 `children`。
 * - 映射 `id` 和 `text` 字段（`name` 或 `label` 字段可作为 `text` 的备用）。
 * - 为缺失的 `position`, `width`, `height`, `color` 等字段补充默认值。
 * - 忽略源数据中的多余字段。
 *
 * @param sourceNode 任何来源的、包含 id, text/name/label, 和 children 的节点对象。
 * @returns 格式化后的 MindMapNodeAST 节点，或在源数据无效时返回 null。
 */
export function transformToMindMapNode(sourceNode: any): MindMapNodeAST | null {
  if (!sourceNode || !sourceNode.id || (!sourceNode.text && !sourceNode.name && !sourceNode.label)) {
    // 基础验证：节点必须存在，且有id和文本内容
    return null;
  }

  const transformedNode: MindMapNodeAST = {
    id: sourceNode.id,
    text: sourceNode.text || sourceNode.name || sourceNode.label,
    position: { x: 0, y: 0 },
    width: 0,
    height: 0,
    color: sourceNode.color || NODE_DEFAULT_COLOR,
    textColor: sourceNode.textColor || NODE_TEXT_COLOR,
    isCollapsed: sourceNode.isCollapsed === true, // 明确检查布尔值 true
    children: [], // 先初始化为空数组
    childrenCount: 0,
  };

  if (sourceNode.children && Array.isArray(sourceNode.children)) {
    transformedNode.children = sourceNode.children
      .map((child: any) => transformToMindMapNode(child)) // 递归转换子节点
      .filter((child): child is MindMapNodeAST => child !== null); // 过滤掉转换失败的子节点
  }

  return transformedNode;
}