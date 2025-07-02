import React from 'react';

type PanelPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

interface PanelProps {
  position: PanelPosition;
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
}

const positionStyleMap: Record<PanelPosition, React.CSSProperties> = {
  'top-left': { top: 16, left: 16, transform: 'none' },
  'top-center': { top: 16, left: '50%', transform: 'translateX(-50%)' },
  'top-right': { top: 16, right: 16, transform: 'none' },
  'bottom-left': { bottom: 16, left: 16, transform: 'none' },
  'bottom-center': { bottom: 16, left: '50%', transform: 'translateX(-50%)' },
  'bottom-right': { bottom: 16, right: 16, transform: 'none' },
};

const Panel: React.FC<PanelProps> = ({ position, style, className, children }) => {
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        zIndex: 20,
        ...positionStyleMap[position],
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Panel; 