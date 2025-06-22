import React from 'react';
import { Button, Icon } from '@alifd/next';
import type { BottomToolbarProps } from '../types';

// 底部视口工具栏组件
const BottomViewportToolbar: React.FC<BottomToolbarProps> = ({
  zoomPercentage,
  isFullscreen,
  isReadOnly,
  onZoomIn,
  onZoomOut,
  onCenterView,
  onFitView,
  onToggleFullscreen,
  onToggleSearchWidget,
  onToggleReadOnly,
}) => {
  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 p-2 sm:p-3 bg-slate-200/90 backdrop-blur-sm rounded-t-lg shadow-lg z-20 flex items-center flex-wrap justify-center gap-1 sm:gap-0">
      <Button onClick={onToggleSearchWidget} title="搜索节点">
        <Icon type="search" /> <span className="hidden sm:inline">搜索</span>
      </Button>

      <div className="h-4 sm:h-5 border-l border-slate-400 mx-1 sm:mx-2"></div>

      <Button onClick={onZoomOut} title="缩小" className="px-2 sm:px-2">
        <Icon type="minus" />
      </Button>
      <div
        className="px-2 py-1.5 mx-0.5 text-xs sm:px-3 sm:py-2 sm:mx-1 sm:text-sm font-medium text-slate-700 whitespace-nowrap w-12 sm:w-16 text-center"
        title="当前缩放级别"
      >
        {zoomPercentage}%
      </div>
      <Button onClick={onZoomIn} title="放大" className="px-2 sm:px-2">
        <Icon type="add" />
      </Button>

      <div className="h-4 sm:h-5 border-l border-slate-400 mx-1 sm:mx-2"></div>

      <Button onClick={onCenterView} title="居中视图">
        <Icon type="target" /> <span className="hidden sm:inline">居中</span>
      </Button>

      <Button onClick={onFitView} title="适应视图">
        <Icon type="expand" /> <span className="hidden sm:inline">适应</span>
      </Button>

      <div className="h-4 sm:h-5 border-l border-slate-400 mx-1 sm:mx-2"></div>

      <Button
        onClick={onToggleReadOnly}
        title={isReadOnly ? "切换到编辑模式" : "切换到只读模式"}
        type={isReadOnly ? 'secondary' : 'primary'}
      >
        {isReadOnly ? (
          <><Icon type="lock" /> <span className="hidden sm:inline">只读</span></>
        ) : (
          <><Icon type="edit" /> <span className="hidden sm:inline">编辑</span></>
        )}
      </Button>

      <div className="h-4 sm:h-5 border-l border-slate-400 mx-1 sm:mx-2"></div>

      <Button onClick={onToggleFullscreen} title={isFullscreen ? "退出全屏" : "进入全屏"}>
        {isFullscreen ? (
          <><Icon type="exit-fullscreen" /> <span className="hidden sm:inline">退出</span></>
        ) : (
          <><Icon type="fullscreen" /> <span className="hidden sm:inline">全屏</span></>
        )}
      </Button>
    </div>
  );
};

export default BottomViewportToolbar;
