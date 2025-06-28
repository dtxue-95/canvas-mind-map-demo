import React, { useState, useRef } from 'react';
import { ReactMindMap, type ReactMindMapProps, type MindMapNode, type DataChangeInfo, OperationType } from './lib';
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
  const [data] = useState(rawInitialData); // 只初始化一次
  const [readOnly, setReadOnly] = useState(false);
  const initialDataRef = useRef(data); // 只初始化一次

  // 只做打印/保存，不做 setData
  const handleDataChangeDetailed = (changeInfo: DataChangeInfo) => {
    // 这里只做打印/保存/导出，不要 setData
    console.log('最新数据', changeInfo.currentData);
    console.log('数据变更详情:', changeInfo);
   // 当前节点链路
   console.log('idChain', changeInfo.idChain);
   // 父节点链路
   console.log('parentIdChain', changeInfo.parentIdChain);
   // 当前节点详细信息
   console.log('currentNode', changeInfo.currentNode);
   // 父节点详细信息
   console.log('parentNode', changeInfo.parentNode);
    // 当前节点链路的节点对象数组
  console.log('idChainNodes', changeInfo.idChainNodes);
  // 父节点链路的节点对象数组
  console.log('parentIdChainNodes', changeInfo.parentIdChainNodes);
    // 根据操作类型进行不同的处理
    switch (changeInfo.operationType) {
      case OperationType.ADD_NODE:
        console.log('新增节点:', changeInfo.addedNodes);
        break;
      case OperationType.DELETE_NODE:
        console.log('删除节点:', changeInfo.deletedNodes);
        break;
      // ... 其他操作类型
    }
  };

  const mindMapProps: ReactMindMapProps = {
    initialData: initialDataRef.current as any, // 允许初始数据为原始对象，组件内部会转换
    onDataChangeDetailed: handleDataChangeDetailed,
    showTopToolbar: true,
    showBottomToolbar: true,
    readOnly,
    getNodeStyle: (node: MindMapNode) => {
      if (node.id === '1') return { background: 'blue', color: 'gray', fontWeight: 'bold' };
      if (node.text.includes('测试')) return { background: '#e0f7fa', border: '2px solid #00bcd4' };
      return {}
    },
    canvasBackgroundColor: "#fffbe6",
    showDotBackground: true,
    showMinimap: false,
    enableContextMenu: true,
  };



  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactMindMap {...mindMapProps} />
    </div>
  );
}

export default App;