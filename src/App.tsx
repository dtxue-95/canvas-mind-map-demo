import React, { useState } from 'react';
import { ReactMindMap, type ReactMindMapProps, type MindMapNode } from './lib';
import { FaSave } from 'react-icons/fa';

// Let the component handle the transformation from raw data to MindMapNode
const rawInitialData = {
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
          id: '5',
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
  const [data, setData] = useState(rawInitialData);
  const [readOnly, setReadOnly] = useState(false);

  // 自定义保存按钮示例，禁用状态自动响应只读/编辑切换
  // const customSaveButton = {
  //   id: 'custom-save',
  //   label: '保存',
  //   icon: FaSave,
  //   action: () => alert('自定义保存！'),
  //   title: '保存当前思维导图',
  //   disabled: (state) => state.isReadOnly, // 自动禁用
  // };

  // 工具条按钮 key 必须与命令 id 完全一致（短横线风格），如 'add-child-node', 'delete-node'
  const mindMapProps: ReactMindMapProps = {
    initialData: data as MindMapNode,
    onDataChange: (newData: MindMapNode) => setData(newData as any),
    showTopToolbar: true, // 控制顶部工具条显示/隐藏
    showBottomToolbar: true, // 控制底部工具条显示/隐藏
    // topToolbarKeys: ['undo', 'redo', 'add-child-node', 'add-sibling-node', 'delete-node'],
    // bottomToolbarKeys: ['toggle-search', 'toggle-fullscreen', 'toggle-read-only', 'zoom-in', 'zoom-out', 'center-view', 'fit-view'],
    // 顶部工具条追加自定义按钮
    // topToolbarCustomButtons: [customSaveButton],
    readOnly,
    getNodeStyle: (node: MindMapNode) => {
      if (node.id === '1') return { background: 'blue', color: 'gray', fontWeight: 'bold' };
      if (node.text.includes('测试')) return { background: '#e0f7fa', border: '2px solid #00bcd4' };
      return {}
    },
    canvasBackgroundColor:"#fffbe6",
    showDotBackground:true,
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactMindMap {...mindMapProps}
       
      />
    </div>
  );
}

export default App;