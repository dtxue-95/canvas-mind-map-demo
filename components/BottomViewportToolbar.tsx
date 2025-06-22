import React from 'react';
import type { BottomToolbarProps } from '../types';
import { 
    SearchIcon, PlusIcon, MinusIcon, FullscreenIcon, ExitFullscreenIcon, 
    CenterIcon, FitViewIcon, EditModeIcon, ReadOnlyModeIcon
} from './icons'; 

// 工具栏按钮属性
interface ToolbarButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}

// 工具栏按钮组件
const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, disabled, children, title, active, className }) => {
  const baseStyle = "px-2 py-1.5 mx-0.5 text-xs sm:px-3 sm:py-2 sm:mx-1 sm:text-sm font-medium rounded-md shadow-sm transition-colors flex items-center justify-center";
  let activeStyle = "";
  if (active) {
    activeStyle = "bg-sky-600 text-white hover:bg-sky-700";
  } else {
    activeStyle = "bg-blue-500 text-white hover:bg-blue-600";
  }
  const disabledStyle = "disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseStyle} ${activeStyle} ${disabledStyle} ${className || ''}`}
    >
      {children}
    </button>
  );
};

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
      <ToolbarButton onClick={onToggleSearchWidget} title="搜索节点">
        <SearchIcon className="h-4 w-4 sm:mr-1 inline" /> 
        <span className="hidden sm:inline">搜索</span>
      </ToolbarButton>

      <div className="h-4 sm:h-5 border-l border-slate-400 mx-1 sm:mx-2"></div>
      
      <ToolbarButton onClick={onZoomOut} title="缩小" className="px-2 sm:px-2">
        <MinusIcon />
      </ToolbarButton>
      <div 
        className="px-2 py-1.5 mx-0.5 text-xs sm:px-3 sm:py-2 sm:mx-1 sm:text-sm font-medium text-slate-700 whitespace-nowrap w-12 sm:w-16 text-center"
        title="当前缩放级别"
      >
         {zoomPercentage}%
      </div>
      <ToolbarButton onClick={onZoomIn} title="放大" className="px-2 sm:px-2">
        <PlusIcon />
      </ToolbarButton>

      <div className="h-4 sm:h-5 border-l border-slate-400 mx-1 sm:mx-2"></div>

      <ToolbarButton onClick={onCenterView} title="居中视图">
        <CenterIcon className="h-4 w-4 sm:mr-1 inline" />
        <span className="hidden sm:inline">居中</span>
      </ToolbarButton>

      <ToolbarButton onClick={onFitView} title="适应视图">
        <FitViewIcon className="h-4 w-4 sm:mr-1 inline" />
        <span className="hidden sm:inline">适应</span>
      </ToolbarButton>
      
      <div className="h-4 sm:h-5 border-l border-slate-400 mx-1 sm:mx-2"></div>

      <ToolbarButton 
        onClick={onToggleReadOnly} 
        title={isReadOnly ? "切换到编辑模式" : "切换到只读模式"}
        active={isReadOnly}
      >
        {isReadOnly ? 
            <><ReadOnlyModeIcon className="h-4 w-4 sm:mr-1 inline" /> <span className="hidden sm:inline">只读</span></> : 
            <><EditModeIcon className="h-4 w-4 sm:mr-1 inline" /> <span className="hidden sm:inline">编辑</span></>
        }
      </ToolbarButton>
      
      <div className="h-4 sm:h-5 border-l border-slate-400 mx-1 sm:mx-2"></div>
      
      <ToolbarButton onClick={onToggleFullscreen} title={isFullscreen ? "退出全屏" : "进入全屏"}>
        {isFullscreen ? 
            <><ExitFullscreenIcon className="h-4 w-4 sm:mr-1 inline" /> <span className="hidden sm:inline">退出</span></> : 
            <><FullscreenIcon className="h-4 w-4 sm:mr-1 inline" /> <span className="hidden sm:inline">全屏</span></>
        }
      </ToolbarButton>
    </div>
  );
};

export default BottomViewportToolbar;
