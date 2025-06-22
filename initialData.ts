/**
 * 这是一个原始数据对象，只包含最核心的字段：id, text, 和 children。
 * 它将被 `transformToMindMapNode` 函数处理，转换为项目所需的完整 MindMapNodeAST 格式。
 */
export const rawInitialData = {
  id: '1',
  text: '中心主题：项目规划',
  children: [
    {
      id: '2',
      text: '第一阶段：需求分析',
      children: [
        { id: '3', text: '用户需求调研' },
        { id: '4', text: '功能需求定义' },
        { 
          id:'5', 
          text: '技术可行性分析', 
          children: [
              { id: '6', text: '技术选型' },
              { id: '7', text: '风险评估' },
          ]
        },
      ]
    },
    {
      id: '8',
      text: '第二阶段：设计开发',
      isCollapsed: true, // 示例：这个节点在初始时是折叠的
      children: [
        { id: '9', text: '系统架构设计' },
        { id: '10', text: '数据库设计' },
        { id: '11', text: '前端开发' },
        { id: '12', text: '后端开发' },
      ]
    },
    {
      id: '13',
      text: '第三阶段：测试部署',
      children: [
        { id: '14', text: '单元测试' },
        { id: '15', text: '集成测试' },
        { id: '16', text: '用户验收测试' },
      ]
    },
    {
      id: '17',
      text: '第四阶段：上线维护',
      children: [
        { id: '18', text: '生产环境部署' },
        { id: '19', text: '监控告警' },
        { id: '20', text: '性能优化' },
      ]
    }
  ]
};
