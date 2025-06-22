import React, { useState } from 'react';
import { CommandDescriptor } from '../types';
import { FaChevronLeft, FaTimes } from 'react-icons/fa';

interface BottomViewportToolbarProps {
  commands: CommandDescriptor[];
  zoomPercentage: number;
}

const BottomViewportToolbar: React.FC<BottomViewportToolbarProps> = ({ 
  commands, 
  zoomPercentage 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const zoomInCommand = commands.find(c => c.id === 'zoom-in');
  const zoomOutCommand = commands.find(c => c.id === 'zoom-out');
  const otherCommands = commands.filter(c => c.id !== 'zoom-in' && c.id !== 'zoom-out');
  
  // Display 100 if zoomPercentage is not a valid number
  const displayZoom = !isNaN(zoomPercentage) ? zoomPercentage : 100;

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
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-1/4 right-0 z-50 group cursor-pointer"
        >
          {/* Custom Tooltip */}
          <div className="
            absolute top-1/2 -translate-y-1/2 right-full mr-3
            px-3 py-1 bg-gray-800 text-white text-sm rounded-md shadow-lg
            opacity-0 group-hover:opacity-100 transition-opacity duration-300
            whitespace-nowrap pointer-events-none
          ">
            展开视图工具栏
          </div>

          <div className="
            w-8 h-20 bg-gray-800/30 hover:bg-gray-800/60 backdrop-blur-md
            rounded-l-lg shadow-lg
            flex items-center justify-center
            transition-all duration-300 ease-in-out
            transform translate-x-4 group-hover:translate-x-0
          ">
            <FaChevronLeft className="text-white/70 group-hover:text-white transition-colors" />
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
