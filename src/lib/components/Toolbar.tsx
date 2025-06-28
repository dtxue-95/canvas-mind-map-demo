import React, { useState, useRef, useEffect } from 'react';
import { ToolbarButtonConfig } from '../types';
import { FaChevronLeft, FaTimes } from 'react-icons/fa';

const HANDLE_WIDTH = 32; // 拉手宽度
const HANDLE_HEIGHT = 64; // 拉手高度

interface ToolbarProps {
  commands: ToolbarButtonConfig[];
  handlePosition: { x: number; y: number };
  onPositionChange: (newPos: { x: number; y: number }) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ commands, handlePosition, onPositionChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalPosition, setOriginalPosition] = useState({ x: 0, y: 0 });
  const handleRef = useRef<HTMLDivElement>(null);

  // 鼠标按下开始拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - handlePosition.x,
      y: e.clientY - handlePosition.y
    });
    setOriginalPosition(handlePosition);
    e.preventDefault();
  };

  // 拖拽中
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    // 限制在屏幕范围内
    const maxX = window.innerWidth - HANDLE_WIDTH;
    onPositionChange({
      x: Math.max(0, Math.min(newX, maxX)),
      y: newY // Y轴限制由父组件处理
    });
  };

  // 拖拽结束
  const handleMouseUp = () => {
    if (!isDragging) return;
    const distance = Math.sqrt(
      Math.pow(handlePosition.x - originalPosition.x, 2) +
      Math.pow(handlePosition.y - originalPosition.y, 2)
    );
    setIsDragging(false);
    if (distance < 5) {
      setIsExpanded(true);
    } else {
      const centerX = window.innerWidth / 2;
      const finalX = handlePosition.x + (HANDLE_WIDTH / 2) < centerX ? 0 : window.innerWidth - HANDLE_WIDTH;
      onPositionChange({
        x: finalX,
        y: handlePosition.y
      });
    }
  };

  // 全局鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, handlePosition, originalPosition, onPositionChange]);

  // 判断拉手在左侧还是右侧
  const isOnLeftSide = handlePosition.x < window.innerWidth / 2;

  return (
    <>
      {/* 收起时的拉手 */}
      {!isExpanded && (
        <div
          ref={handleRef}
          onMouseDown={handleMouseDown}
          style={{
            position: 'fixed',
            left: `${handlePosition.x}px`,
            top: `${handlePosition.y}px`,
            height: `${HANDLE_HEIGHT}px`,
            width: `${HANDLE_WIDTH}px`,
            zIndex: 50,
            cursor: isDragging ? 'grabbing' : 'grab',
            transition: 'left 0.2s ease-out, top 0.1s linear'
          }}
          className="group"
        >
          {/* 自定义提示 */}
          <div className={`
            absolute top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-800 text-white text-sm rounded-md shadow-lg
            opacity-0 group-hover:opacity-100 transition-opacity duration-300
            whitespace-nowrap pointer-events-none
            ${isOnLeftSide ? 'left-full ml-3' : 'right-full mr-3'}
          `}>
            展开主工具栏
          </div>
          <div className={`
            w-full h-full bg-gray-800/30 hover:bg-gray-800/60 backdrop-blur-md
            shadow-lg
            flex items-center justify-center
            transition-all duration-300 ease-in-out
            select-none
            transform
            ${isOnLeftSide 
              ? 'rounded-r-lg translate-x-[-24px] group-hover:translate-x-0' 
              : 'rounded-l-lg translate-x-[24px] group-hover:translate-x-0'
            }
          `}>
            <FaChevronLeft className={`
              text-white/70 group-hover:text-white transition-transform duration-300
              ${isOnLeftSide ? 'rotate-180' : ''}
            `} />
          </div>
        </div>
      )}

      {/* 工具条容器，全部按钮横向排列 */}
      <div
        className={`
          fixed top-4 left-1/2 -translate-x-1/2 z-40
          transition-all duration-300 ease-out
          ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 -translate-y-full pointer-events-none'}
        `}
      >
        <div className="relative bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200/50 p-2 flex items-center space-x-2">
          {/* 遍历所有按钮（内置+自定义） */}
          <div className="flex items-center space-x-1">
            {commands.map((command) => (
              <button
                key={command.id}
                onClick={command.action}
                disabled={command.disabled as boolean}
                title={command.title}
                className="flex flex-col items-center justify-center w-20 h-16 rounded-lg transition-colors duration-200 text-gray-600 disabled:text-gray-300 hover:bg-gray-200/70 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
              >
                <span className="text-2xl mb-1 flex items-center justify-center">
                  {command.icon && React.createElement(command.icon)}
                </span>
                <span className="text-xs font-medium">{command.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            title="收起工具栏"
            className="absolute top-[-8px] right-[-8px] w-6 h-6 bg-gray-300 hover:bg-gray-400 text-white rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-125 z-10"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>
      </div>
    </>
  );
};

export default Toolbar;
