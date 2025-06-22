import { MindMapNodeAST } from './types';
import { NODE_DEFAULT_COLOR, NODE_TEXT_COLOR } from './constants'; // 导入默认颜色

// 辅助函数：轻松创建模拟数据节点
function createMockNode(id: string, text: string, children: MindMapNodeAST[] = [], isCollapsed = false, childrenCount = 0): MindMapNodeAST {
    return {
        id,
        text,
        position: { x: 0, y: 0 }, // 布局引擎将设置此值
        width: 0,                 // 布局引擎将设置此值
        height: 0,                // 布局引擎将设置此值
        color: NODE_DEFAULT_COLOR,
        textColor: NODE_TEXT_COLOR,
        children,
        isCollapsed,
        childrenCount: isCollapsed ? childrenCount : 0, // 仅在折叠时设置计数
    };
}

// 递归处理节点树，规范化数据结构
function normalizeNodes(nodes: MindMapNodeAST[]): MindMapNodeAST[] {
  return nodes.map(node => {
    // 递归处理子节点
    const processedChildren = node.children ? normalizeNodes(node.children) : [];
    
    // 计算实际子节点数量（用于折叠状态显示）
    const actualChildrenCount = processedChildren.length;
    
    // 创建规范化节点（保留原始节点的 isCollapsed 状态）
    return createMockNode(
      node.id,
      node.text,
      processedChildren,
      node.isCollapsed ?? false,  // 使用原始值或默认false
      actualChildrenCount         // 传入实际子节点数量
    );
  });
}

// 默认初始根节点数据 - 思维导图示例
export const defaultInitialRootNodes: MindMapNodeAST[] = normalizeNodes([
  {
    id: '1',
    text: '中心主题：项目规划',
    children: [
      {
        id: '2',
        text: '第一阶段：需求分析',
        children: [
          { 
            id: '3', 
            text: '用户需求调研', 
            children: [],
            position: { x: 0, y: 0 },
            width: 0,
            height: 0,
            color: NODE_DEFAULT_COLOR,
            textColor: NODE_TEXT_COLOR,
            isCollapsed: false
          },
          { 
            id: '4', 
            text: '功能需求定义', 
            children: [],
            position: { x: 0, y: 0 },
            width: 0,
            height: 0,
            color: NODE_DEFAULT_COLOR,
            textColor: NODE_TEXT_COLOR,
            isCollapsed: false
          },
          { 
            id:'5', 
            text: '技术可行性分析', 
            children: [
                { 
                  id: '6', 
                  text: '技术选型', 
                  children: [],
                  position: { x: 0, y: 0 },
                  width: 0,
                  height: 0,
                  color: NODE_DEFAULT_COLOR,
                  textColor: NODE_TEXT_COLOR,
                  isCollapsed: false
                },
                { 
                  id: '7', 
                  text: '风险评估', 
                  children: [],
                  position: { x: 0, y: 0 },
                  width: 0,
                  height: 0,
                  color: NODE_DEFAULT_COLOR,
                  textColor: NODE_TEXT_COLOR,
                  isCollapsed: false
                },
            ], 
            position: { x: 0, y: 0 },
            width: 0,
            height: 0,
            color: NODE_DEFAULT_COLOR,
            textColor: NODE_TEXT_COLOR,
            isCollapsed: false
          },
        ],
        position: { x: 0, y: 0 },
        width: 0,
        height: 0,
        color: NODE_DEFAULT_COLOR,
        textColor: NODE_TEXT_COLOR,
        isCollapsed: false
      },
      {
        id: '8',
        text: '第二阶段：设计开发',
        children: [
          { 
            id: '9', 
            text: '系统架构设计', 
            children: [],
            position: { x: 0, y: 0 },
            width: 0,
            height: 0,
            color: NODE_DEFAULT_COLOR,
            textColor: NODE_TEXT_COLOR,
            isCollapsed: false
          },
          { 
            id: '10', 
            text: '数据库设计', 
            children: [],
            position: { x: 0, y: 0 },
            width: 0,
            height: 0,
            color: NODE_DEFAULT_COLOR,
            textColor: NODE_TEXT_COLOR,
            isCollapsed: false
          },
          { 
            id: '11', 
            text: '前端开发', 
            children: [],
            position: { x: 0, y: 0 },
            width: 0,
            height: 0,
            color: NODE_DEFAULT_COLOR,
            textColor: NODE_TEXT_COLOR,
            isCollapsed: false
          },
          { 
            id: '12', 
            text: '后端开发', 
            children: [],
            position: { x: 0, y: 0 },
            width: 0,
            height: 0,
            color: NODE_DEFAULT_COLOR,
            textColor: NODE_TEXT_COLOR,
            isCollapsed: false
          },
        ],
        position: { x: 0, y: 0 },
        width: 0,
        height: 0,
        color: NODE_DEFAULT_COLOR,
        textColor: NODE_TEXT_COLOR,
        isCollapsed: false
      },
      {
        id: '13',
        text: '第三阶段：测试部署',
        children: [
          { 
            id: '14', 
            text: '单元测试', 
            children: [],
            position: { x: 0, y: 0 },
            width: 0,
            height: 0,
            color: NODE_DEFAULT_COLOR,
            textColor: NODE_TEXT_COLOR,
            isCollapsed: false
          },
          { 
            id: '15', 
            text: '集成测试', 
            children: [],
            position: { x: 0, y: 0 },
            width: 0,
            height: 0,
            color: NODE_DEFAULT_COLOR,
            textColor: NODE_TEXT_COLOR,
            isCollapsed: false
          },
          { 
            id: '16', 
            text: '用户验收测试', 
            children: [],
            position: { x: 0, y: 0 },
            width: 0,
            height: 0,
            color: NODE_DEFAULT_COLOR,
            textColor: NODE_TEXT_COLOR,
            isCollapsed: false
          },
        ],
        position: { x: 0, y: 0 },
        width: 0,
        height: 0,
        color: NODE_DEFAULT_COLOR,
        textColor: NODE_TEXT_COLOR,
        isCollapsed: false
      },
      {
        id: '17',
        text: '第四阶段：上线维护',
        children: [
          { 
            id: '18', 
            text: '生产环境部署', 
            children: [],
            position: { x: 0, y: 0 },
            width: 0,
            height: 0,
            color: NODE_DEFAULT_COLOR,
            textColor: NODE_TEXT_COLOR,
            isCollapsed: false
          },
          { 
            id: '19', 
            text: '监控告警', 
            children: [],
            position: { x: 0, y: 0 },
            width: 0,
            height: 0,
            color: NODE_DEFAULT_COLOR,
            textColor: NODE_TEXT_COLOR,
            isCollapsed: false
          },
          { 
            id: '20', 
            text: '性能优化', 
            children: [],
            position: { x: 0, y: 0 },
            width: 0,
            height: 0,
            color: NODE_DEFAULT_COLOR,
            textColor: NODE_TEXT_COLOR,
            isCollapsed: false
          },
        ],
        position: { x: 0, y: 0 },
        width: 0,
        height: 0,
        color: NODE_DEFAULT_COLOR,
        textColor: NODE_TEXT_COLOR,
        isCollapsed: false
      }
    ],
    position: { x: 0, y: 0 },
    width: 0,
    height: 0,
    color: NODE_DEFAULT_COLOR,
    textColor: NODE_TEXT_COLOR,
    isCollapsed: false
  }
]);

// 示例：如何使用 countAllDescendants 进行动态计算
// 如果 childrenCount 在静态数据中预计算，则不需要严格使用
// import { countAllDescendants } from './nodeUtils';
// const riskNode = projectAlphaMockData.children[0].children[2];
// if (riskNode.isCollapsed) {
//   riskNode.childrenCount = countAllDescendants(riskNode);
// }
// 类似地，对于其他预折叠节点，如果需要在加载时动态计算，可以这样做。
// 对于这个静态数据，预计算更简单。
