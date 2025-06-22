import React, { useState } from 'react';
import { CommandDescriptor } from '../types';
import { FaChevronLeft, FaTimes } from 'react-icons/fa';

interface ToolbarProps {
  commands: CommandDescriptor[];
}

const Toolbar: React.FC<ToolbarProps> = ({ commands }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const commandGroups = [
    commands.slice(0, 2), // Undo, Redo
    commands.slice(2, 5), // Child, Sibling, Delete
  ];

  return (
    <>
      {/* Collapsed Handle */}
      {!isExpanded && (
        <div
          onClick={() => setIsExpanded(true)}
          className="fixed top-1/4 right-0 z-50 group cursor-pointer"
        >
          {/* Custom Tooltip */}
          <div className="
            absolute top-1/2 -translate-y-1/2 right-full mr-3
            px-3 py-1 bg-gray-800 text-white text-sm rounded-md shadow-lg
            opacity-0 group-hover:opacity-100 transition-opacity duration-300
            whitespace-nowrap pointer-events-none
          ">
            展开主工具栏
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
          fixed top-4 left-1/2 -translate-x-1/2 z-40
          transition-all duration-300 ease-out
          ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 -translate-y-full pointer-events-none'}
        `}
      >
        <div className="relative bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200/50 p-2 flex items-center space-x-2">
          {commandGroups.map((group, index) => (
            <React.Fragment key={index}>
              <div className="flex items-center space-x-1">
                {group.map((command) => (
                  <button
                    key={command.id}
                    onClick={command.action}
                    disabled={command.disabled}
                    title={command.title}
                    className="flex flex-col items-center justify-center w-20 h-16 rounded-lg transition-colors duration-200 text-gray-600 disabled:text-gray-300 hover:bg-gray-200/70 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span className="text-2xl mb-1 flex items-center justify-center">
                      <command.icon />
                    </span>
                    <span className="text-xs font-medium">{command.label}</span>
                  </button>
                ))}
              </div>
              {index < commandGroups.length - 1 && (
                <div className="h-10 border-l border-gray-300 mx-1"></div>
              )}
            </React.Fragment>
          ))}
          
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
