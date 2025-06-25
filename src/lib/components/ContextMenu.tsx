import React from 'react';

export interface ContextMenuAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}

export interface ContextMenuGroup {
  actions: ContextMenuAction[];
}

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  groups: ContextMenuGroup[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ visible, x, y, groups, onClose }) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!visible) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      onClose();
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('mousedown', handle);
    window.addEventListener('contextmenu', handle);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('mousedown', handle);
      window.removeEventListener('contextmenu', handle);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [visible, onClose]);

  if (!visible) return null;
  return (
    <div ref={menuRef} style={{ position: 'fixed', left: x, top: y, zIndex: 9999, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: 6, minWidth: 160, padding: 4 }}>
      {groups.map((group, i) => (
        <div key={i} style={{ borderTop: i > 0 ? '1px solid #eee' : undefined, marginTop: i > 0 ? 4 : 0, paddingTop: i > 0 ? 4 : 0 }}>
          {group.actions.map(action => {
            return (
              <div
                key={action.key}
                style={{ padding: '6px 16px', color: action.disabled ? '#bbb' : '#222', cursor: action.disabled ? 'not-allowed' : 'pointer', fontSize: 14, borderRadius: 4, userSelect: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
                onClick={() => { if (!action.disabled) { action.onClick(); onClose(); } }}
              >
                {action.icon && <span style={{ marginRight: 8, display: 'flex', alignItems: 'center' }}>{action.icon}</span>}
                {action.label}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu; 