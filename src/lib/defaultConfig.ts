import {
  FaPlus, FaMinus, FaTrash, FaSitemap, FaSearch, FaExpandArrowsAlt,
  FaCompressArrowsAlt, FaLock, FaUnlock, FaCrosshairs, FaVectorSquare
} from 'react-icons/fa';
import { MindMapNodeAST, ToolbarButtonConfig } from './types';
import { NEW_NODE_TEXT } from './constants';
import { findNodeAndParentInAST } from './utils/nodeUtils';

type State = {
  selectedNodeId: string | null;
  isReadOnly: boolean;
  isFullscreen: boolean;
  rootNode: MindMapNodeAST | null;
};

type Handlers = {
  addNode: (text: string, parentId?: string | null) => void;
  deleteNode: (nodeId: string) => void;
  zoom: (delta: number, center: { x: number, y: number }) => void;
  fitView: (centerOnly?: boolean) => void;
  fitViewCenter?: () => void;
  toggleFullscreen: () => void;
  toggleReadOnlyMode: () => void;
  toggleSearch: () => void;
};

type CanvasSize = { width: number, height: number } | null;

// 静态的、可直接导入的默认按钮配置
export const defaultTopButtons: ToolbarButtonConfig[] = [
  { id: 'add-node', label: '添加节点', action: () => {}, icon: FaPlus },
  { id: 'add-child', label: '添加子节点', action: () => {}, icon: FaSitemap, disabled: true },
  { id: 'delete-node', label: '删除节点', action: () => {}, icon: FaTrash, disabled: true },
];

export const defaultBottomButtons: ToolbarButtonConfig[] = [
  { id: 'zoom-out', label: '缩小', action: () => {}, icon: FaMinus },
  { id: 'zoom-in', label: '放大', action: () => {}, icon: FaPlus },
  { id: 'center-content', label: '居中', action: () => {}, icon: FaCrosshairs },
  { id: 'fit-view', label: '适应', action: () => {}, icon: FaVectorSquare },
  { id: 'toggle-fullscreen', label: '全屏', action: () => {}, icon: FaExpandArrowsAlt },
  { id: 'toggle-readonly', label: '只读', action: () => {}, icon: FaLock },
  { id: 'search', label: '搜索', action: () => {}, icon: FaSearch },
];

export const getDefaultTopToolbarConfig = (state: State, handlers: Handlers): ToolbarButtonConfig[] => {
  const canAddChild = !!state.selectedNodeId;
  
  let parentOfSelectedId: string | null = null;
  if (state.selectedNodeId && state.rootNode && state.selectedNodeId !== state.rootNode.id) {
    const result = findNodeAndParentInAST(state.rootNode, state.selectedNodeId);
    if (result && result.parent) {
      parentOfSelectedId = result.parent.id;
    }
  }

  const canAddSibling = !!parentOfSelectedId;
  const canDelete = !!state.selectedNodeId && !!state.rootNode && state.selectedNodeId !== state.rootNode.id;

  return [
    {
      id: 'add-node',
      label: '添加节点',
      action: () => { if (parentOfSelectedId) handlers.addNode(NEW_NODE_TEXT, parentOfSelectedId); },
      disabled: state.isReadOnly || !canAddSibling,
      title: canAddSibling ? '添加兄弟节点 (Insert)' : '请选择一个非根节点以添加兄弟节点',
      icon: FaPlus,
      visible: true,
    },
    {
      id: 'add-child',
      label: '添加子节点',
      action: () => { if (canAddChild) handlers.addNode(NEW_NODE_TEXT, state.selectedNodeId); },
      disabled: !canAddChild || state.isReadOnly,
      title: canAddChild ? '添加子节点 (Tab)' : '请先选择一个节点',
      icon: FaSitemap,
      visible: true,
    },
    {
      id: 'delete-node',
      label: '删除节点',
      action: () => { if (canDelete) handlers.deleteNode(state.selectedNodeId!); },
      disabled: !canDelete || state.isReadOnly,
      title: canDelete ? '删除节点 (Delete)' : '请先选择一个节点（根节点无法删除）',
      icon: FaTrash,
      visible: true,
    },
  ];
};

export const getDefaultBottomToolbarConfig = (state: State, handlers: Handlers, canvasSize: CanvasSize): ToolbarButtonConfig[] => {
  return [
    {
      id: 'zoom-out',
      label: '缩小',
      action: () => { if (canvasSize) handlers.zoom(150, { x: canvasSize.width / 2, y: canvasSize.height / 2 }); },
      title: '缩小 (-)',
      icon: FaMinus,
      visible: true,
    },
    {
      id: 'zoom-in',
      label: '放大',
      action: () => { if (canvasSize) handlers.zoom(-100, { x: canvasSize.width / 2, y: canvasSize.height / 2 }); },
      title: '放大 (+)',
      icon: FaPlus,
      visible: true,
    },
    {
      id: 'center-content',
      label: '居中',
      action: () => handlers.fitViewCenter ? handlers.fitViewCenter() : handlers.fitView(true),
      title: '居中内容',
      icon: FaCrosshairs,
      visible: true,
    },
    {
      id: 'fit-view',
      label: '适应',
      action: () => handlers.fitView(false),
      title: '适应视图',
      icon: FaVectorSquare,
      visible: true,
    },
    {
      id: 'toggle-fullscreen',
      label: state.isFullscreen ? '退出全屏' : '全屏',
      action: () => handlers.toggleFullscreen(),
      title: state.isFullscreen ? '退出全屏' : '进入全屏',
      icon: state.isFullscreen ? FaCompressArrowsAlt : FaExpandArrowsAlt,
      visible: true,
    },
    {
      id: 'toggle-readonly',
      label: state.isReadOnly ? '只读' : '可编辑',
      action: () => handlers.toggleReadOnlyMode(),
      title: state.isReadOnly ? '当前为只读模式，点击切换为可编辑' : '当前为可编辑模式，点击切换为只读',
      icon: state.isReadOnly ? FaLock : FaUnlock,
      visible: true,
    },
    {
      id: 'search',
      label: '搜索',
      action: () => handlers.toggleSearch(),
      title: '搜索节点 (Cmd+F)',
      icon: FaSearch,
      visible: true,
    },
  ];
}; 