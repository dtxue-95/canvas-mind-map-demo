import React, { useState, useRef } from 'react';
import { ReactMindMap, type ReactMindMapProps, type MindMapNode, type DataChangeInfo, OperationType } from './lib';
import { FaSave } from 'react-icons/fa';
import { Panel } from './lib/ReactMindMap';

// 示例1：无类型模式（所有节点为普通节点）
const rawInitialDataNone = {
  id: '1',
  text: '普通根节点',
  nodeType: 'normal',
  children: [
    { id: '2', text: '普通子节点1', nodeType: 'normal' },
    { id: '3', text: '普通子节点2', nodeType: 'normal' },
  ]
};

// 示例2：内置类型模式（推荐结构）
const rawInitialDataBuiltin = {
  id: '1',
  text: '项目测试用例哈哈哈哈哈哈哈哈哈哈哈哈哈哈',
  nodeType: 'rootNode',
  // priority: 0,
  children: [
    {
      id: '2',
      text: '模块A',
      nodeType: 'moduleNode',
      priority: 1,
      children: [
        {
          id: '3',
          text: '登录功能',
          nodeType: 'testPointNode',
          priority: 1,
          children: [
            {
              id: '4',
              text: '登录成功',
              nodeType: 'caseNode',
              priority: 0,
              children: [
                { id: '5', text: '已注册用户', nodeType: 'preconditionNode' },
                {
                  id: '6', text: '输入正确账号密码', priority: 0, nodeType: 'stepNode', children: [
                    { id: '7', text: '进入首页', priority: 0, nodeType: 'resultNode' }
                  ]
                },
                {
                  id: '8', text: '点击登录按钮', nodeType: 'stepNode', children: [
                    { id: '9', text: '页面跳转', nodeType: 'resultNode' }
                  ]
                },
              ]
            }
          ]
        }
      ]
    },
    {
      id: '10',
      text: '模块B哈哈哈哈哈哈哈哈哈',
      nodeType: 'moduleNode',
      children: []
    }
  ]
};

// 示例3：自定义类型模式
const rawInitialDataCustom = {
  id: '1',
  text: '自定义根',
  nodeType: 'customRoot',
  children: [
    {
      id: '2', text: 'A类型节点', nodeType: 'A', children: [
        { id: '3', text: 'B类型节点', nodeType: 'B' }
      ]
    }
  ]
};

// typeConfig 配置示例
const typeConfigNone = { mode: 'none' };
const typeConfigBuiltin = { mode: 'builtin' };
const typeConfigCustom = {
  mode: 'custom',
  customTypes: [
    { type: 'customRoot', label: '自定义根', color: '#888', canAddTo: [], canAddChildren: ['A'] },
    { type: 'A', label: '类型A', color: '#34c759', canAddTo: ['customRoot'], canAddChildren: ['B'] },
    { type: 'B', label: '类型B', color: '#ff9500', canAddTo: ['A'], canAddChildren: [] },
  ]
};

function App() {
  // 1. 无类型模式用法
  // const [data] = useState(rawInitialDataNone);
  // const typeConfig = typeConfigNone;

  // 2. 内置类型模式用法（推荐）
  const [data] = useState(rawInitialDataBuiltin);
  const typeConfig = typeConfigBuiltin;

  // 3. 自定义类型模式用法
  // const [data] = useState(rawInitialDataCustom);
  // const typeConfig = typeConfigCustom;

  const [readOnly, setReadOnly] = useState(false);
  const initialDataRef = useRef(data);

  const handleDataChangeDetailed = (changeInfo: DataChangeInfo) => {
    console.log('最新数据', changeInfo.currentData);
  };

  const mindMapProps: ReactMindMapProps = {
    initialData: initialDataRef.current as any,
    onDataChangeDetailed: handleDataChangeDetailed,
    showTopToolbar: true,
    showBottomToolbar: true,
    readOnly,
    getNodeStyle: (node: MindMapNode) => {
      if (node.id === '1') return { background: '#f0f0f0', color: 'gray', fontWeight: 'bold' };
      if (node.text.includes('测试')) return { background: '#e0f7fa', border: '2px solid #00bcd4' };
      return {}
    },
    canvasBackgroundColor: "#fffbe6",
    showDotBackground: true,
    showMinimap: true,
    enableContextMenu: true,
    typeConfig,
    priorityConfig: {
      enabled: true, editable: true, options: [
        { value: 0, label: 'P0', color: '#ff3b30' },
        { value: 1, label: 'P1', color: '#ff9500' },
        { value: 2, label: 'P2', color: '#007aff' },
        { value: 3, label: 'P3', color: '#8e8e93' }
      ],
      typeWhiteList: ['caseNode'] // 只有这些类型节点才显示添加/修改优先级

    },
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Panel position="top-right">
        <div>Hello</div>
      </Panel>
      <ReactMindMap {...mindMapProps} />

    </div>
  );
}

export default App;