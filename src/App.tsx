import React, { useState } from 'react';
import {
  ReactMindMap,
  type ReactMindMapProps,
  type MindMapNode,
  type ToolbarButtonConfig,
  defaultTopButtons,
  defaultBottomButtons
} from './lib'; // <--- 主要变化在这里
// import { initialData } from './lib/initialData'; // <--- 同样，从 lib 导入

// 确保 initialData 符合 MindMapNode 类型
const typedInitialData: MindMapNode =  {
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

function App() {
  const [data, setData] = useState<MindMapNode>(typedInitialData);

  // 示例：自定义顶部工具栏，移除"删除"按钮
  const customTopToolbar: ToolbarButtonConfig[] = defaultTopButtons.filter(btn => btn.id !== 'delete-node');

  const mindMapProps: ReactMindMapProps = {
    initialData: data,
    onDataChange: setData, // 假设 onDataChange prop 存在
    showTopToolbar: true,
    showBottomToolbar: true,
    readOnly: false,
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactMindMap {...mindMapProps} />
    </div>
  );
}

export default App;