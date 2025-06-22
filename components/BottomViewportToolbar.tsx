import React, { useState, useRef, useEffect } from 'react';
import { CommandDescriptor } from '../types';
import { FaChevronLeft, FaTimes } from 'react-icons/fa';

const HANDLE_WIDTH = 32; // px
const HANDLE_HEIGHT = 64; // px

interface BottomViewportToolbarProps {
  commands: CommandDescriptor[];
  zoomPercentage: number;
  handlePosition: { x: number; y: number };
  onPositionChange: (newPos: { x: number; y: number }) => void;
}

const BottomViewportToolbar: React.FC<BottomViewportToolbarProps> = ({ 
  commands, 
  zoomPercentage,
  handlePosition,
  onPositionChange
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalPosition, setOriginalPosition] = useState({ x: 0, y: 0 });
  const handleRef = useRef<HTMLDivElement>(null);

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

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    const maxX = window.innerWidth - HANDLE_WIDTH;
    
    onPositionChange({
      x: Math.max(0, Math.min(newX, maxX)),
      y: newY
    });
  };

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

  const zoomInCommand = commands.find(c => c.id === 'zoom-in');
  const zoomOutCommand = commands.find(c => c.id === 'zoom-out');
  const otherCommands = commands.filter(c => c.id !== 'zoom-in' && c.id !== 'zoom-out');
  
  const displayZoom = !isNaN(zoomPercentage) ? zoomPercentage : 100;

  const isOnLeftSide = handlePosition.x < window.innerWidth / 2;

  const IconButton: React.FC<{ command: CommandDescriptor }> = ({ command }) => (
    <div className="group relative flex items-center">
      <button
        onClick={command.action}
        disabled={command.disabled}
        className="
          transition-all duration-200 hover:scale-110
          bg-gray-200/50 hover:bg-gray-300/70
          disabled:bg-transparent disabled:text-gray-400
          text-gray-700
          rounded-full w-10 h-10 p-0 flex items-center justify-center
          disabled:cursor-not-allowed
        "
      >
        <span className="flex items-center justify-center text-xl">
          <command.icon />
        </span>
      </button>
      <div className="
        absolute bottom-full left-1/2 -translate-x-1/2 mb-2
        px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-lg
        opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap
        pointer-events-none
      ">
        {command.title}
      </div>
    </div>
  );

  return (
    <>
      {/* Collapsed Handle */}
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
          {/* Custom Tooltip */}
          <div className={`
            absolute top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-800 text-white text-sm rounded-md shadow-lg
            opacity-0 group-hover:opacity-100 transition-opacity duration-300
            whitespace-nowrap pointer-events-none
            ${isOnLeftSide ? 'left-full ml-3' : 'right-full mr-3'}
          `}>
            展开视图工具栏
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

      {/* Toolbar Container */}
      <div
        className={`
          fixed bottom-4 left-1/2 -translate-x-1/2 z-40
          transition-all duration-300 ease-out
          ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 translate-y-full pointer-events-none'}
        `}
      >
        <div className="relative bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200/50 p-2 flex items-center space-x-2">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            {zoomOutCommand && <IconButton command={zoomOutCommand} />}
            <div className="px-3 py-1 text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[4rem] text-center">
              {displayZoom}%
            </div>
            {zoomInCommand && <IconButton command={zoomInCommand} />}
          </div>

          {/* Separator */}
          <div className="h-8 border-l border-gray-300"></div>

          {/* Other Commands */}
          <div className="flex items-center space-x-2">
            {otherCommands.map((command) => (
              <IconButton key={command.id} command={command} />
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

export default BottomViewportToolbar;
