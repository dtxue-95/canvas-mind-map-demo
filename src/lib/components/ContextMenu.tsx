import React from 'react';

export interface ContextMenuAction {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  children?: ContextMenuAction[];
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

function PriorityLabel({ label, color, bg }: { label: string; color: string; bg?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 24,
        borderRadius: 8,
        background: bg || '#fff',
        color,
        border: `1.5px solid ${color}`,
        fontWeight: 500,
        fontSize: 14,
        padding: '0 12px',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        minWidth: 36,
        justifyContent: 'center'
      }}
    >
      {label}
    </span>
  );
}

const ContextMenu: React.FC<ContextMenuProps> = ({ visible, x, y, groups, onClose }) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [submenuState, setSubmenuState] = React.useState<{ parentKey: string; actions: ContextMenuAction[]; anchorRect: DOMRect | null } | null>(null);

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
            const hasChildren = Array.isArray(action.children) && action.children.length > 0;
            return (
              <div
                key={action.key}
                style={{ position: 'relative', padding: '6px 16px', color: action.disabled ? '#bbb' : '#222', cursor: action.disabled ? 'not-allowed' : 'pointer', fontSize: 14, borderRadius: 4, userSelect: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
                onClick={e => {
                  if (!action.disabled && !hasChildren) { action.onClick(); onClose(); }
                }}
                onMouseEnter={e => {
                  if (hasChildren) {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    setSubmenuState({ parentKey: action.key, actions: action.children!, anchorRect: rect });
                  } else {
                    setSubmenuState(null);
                  }
                }}
                onMouseLeave={e => {
                  if (!hasChildren) setSubmenuState(null);
                }}
              >
                {action.icon && <span style={{ marginRight: 8, display: 'flex', alignItems: 'center' }}>{action.icon}</span>}
                {typeof action.label === 'string' ? <span>{action.label}</span> : action.label}
                {hasChildren && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#888' }}>▶</span>}
                {hasChildren && submenuState && submenuState.parentKey === action.key && submenuState.anchorRect && (
                  <div
                    style={{
                      position: 'fixed',
                      left: submenuState.anchorRect.right + 2,
                      top: submenuState.anchorRect.top,
                      zIndex: 10000,
                      background: '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      borderRadius: 6,
                      minWidth: 140,
                      padding: 4,
                    }}
                    onMouseLeave={() => setSubmenuState(null)}
                  >
                    {submenuState.actions.map(subAction => (
                      <div
                        key={subAction.key}
                        style={{ padding: '6px 16px', color: subAction.disabled ? '#bbb' : '#222', cursor: subAction.disabled ? 'not-allowed' : 'pointer', fontSize: 14, borderRadius: 4, userSelect: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
                        onClick={() => { if (!subAction.disabled) { subAction.onClick(); onClose(); } }}
                      >
                        {typeof subAction.label === 'string' ? <span>{subAction.label}</span> : subAction.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu; 