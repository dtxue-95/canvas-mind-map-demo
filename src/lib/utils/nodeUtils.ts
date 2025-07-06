import { MindMapNode } from '../types';
import { NODE_DEFAULT_COLOR, NODE_TEXT_COLOR } from '../constants';

/**
 * 生成一个简单的唯一ID
 */
function generateId(): string {
  // 结合时间戳和随机字符串以提高唯一性
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 创建新节点
 * @param id 节点唯一标识符
 * @param text 节点文本内容
 * @returns 新创建的节点
 */
export function createNode(id: string, text: string): MindMapNode {
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
export function countAllDescendants(node: MindMapNode | null): number {
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
export function deepCopyAST(node: MindMapNode | null): MindMapNode | null {
  if (!node) {
    return null;
  }

  const copiedNode: MindMapNode = {
    ...node, // 复制基本属性
    position: { ...node.position }, // 深度复制位置
    // 递归复制子节点
    children: node.children ? node.children.map((child: MindMapNode) => deepCopyAST(child)!) : [],
  };
  // 过滤掉空值（如果任何子节点的 deepCopyAST 返回 null，虽然如果子节点有效则不应该发生）
  copiedNode.children = copiedNode.children.filter((child: MindMapNode | null) => child !== null) as MindMapNode[];
  
  return copiedNode;
}

/**
 * 在AST中查找指定ID的节点
 * @param rootNode 根节点
 * @param nodeId 要查找的节点ID
 * @returns 找到的节点或null
 */
export function findNodeInAST(rootNode: MindMapNode | null, nodeId: string): MindMapNode | null {
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
  current: MindMapNode | null,
  nodeId: string,
  parent: MindMapNode | null = null
): { node: MindMapNode; parent: MindMapNode | null } | null {
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
 * 将任意数据结构的节点转换为项目所需的 MindMapNode 格式。
 * - 递归处理 `children`。
 * - 映射 `id` 和 `text` 字段（`name` 或 `label` 字段可作为 `text` 的备用）。
 * - 为缺失的 `position`, `width`, `height`, `color` 等字段补充默认值。
 * - 忽略源数据中的多余字段。
 *
 * @param obj 任何结构的对象
 * @returns 一个符合MindMapNode规范的对象
 */
export function transformToMindMapNode(obj: any): MindMapNode {
  if (!obj || typeof obj !== 'object') {
    // 对于无效输入，返回一个默认节点或抛出错误
    return createNode(generateId(), '无效节点');
  }

  const newNode: MindMapNode = createNode(
    obj.id || generateId(),
    obj.text || '未命名节点'
  );

  // 递归转换子节点
  if (obj.children && Array.isArray(obj.children)) {
    newNode.children = obj.children.map(transformToMindMapNode);
  }

  // 显式地从原始对象复制可选属性
  if (obj.color) newNode.color = obj.color;
  if (obj.textColor) newNode.textColor = obj.textColor;
  if ('isCollapsed' in obj) newNode.isCollapsed = !!obj.isCollapsed;
  else newNode.isCollapsed = false;
  if (obj.nodeType) newNode.nodeType = obj.nodeType;
  if (obj.priority !== undefined) newNode.priority = obj.priority;

  // 尺寸和位置将由布局引擎后续计算和设置
  return newNode;
}

/**
 * 获取节点的纯净原始数据（递归去除所有渲染/运行时属性，仅保留初始业务字段）
 * @param node 当前节点
 * @returns 纯净数据对象
 */
export function pureNodeData(node: MindMapNode): any {
  if (!node) return node;
  const {
    id,
    text,
    nodeType,
    priority,
    children
  } = node;
  const result: any = { id, text };
  if (nodeType) result.nodeType = nodeType;
  if (priority !== undefined) result.priority = priority;
  if (children && Array.isArray(children) && children.length > 0) {
    result.children = children.map(pureNodeData);
  }
  return result;
}