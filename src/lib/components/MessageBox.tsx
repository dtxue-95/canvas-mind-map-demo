import React from 'react';
import { FaCheckCircle, FaExclamationCircle, FaTimesCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

const MESSAGE_TYPE_CONFIG = {
  info:    { color: '#2563eb', bg: '#fff', icon: <FaInfoCircle style={{marginRight:8, color: '#2563eb'}}/> },
  success: { color: '#16a34a', bg: '#fff', icon: <FaCheckCircle style={{marginRight:8, color: '#16a34a'}}/> },
  error:   { color: '#dc2626', bg: '#fff', icon: <FaTimesCircle style={{marginRight:8, color: '#dc2626'}}/> },
  warning: { color: '#f59e42', bg: '#fff', icon: <FaExclamationTriangle style={{marginRight:8, color: '#f59e42'}}/> },
  custom:  { color: '#6b7280', bg: '#fff', icon: <FaExclamationCircle style={{marginRight:8, color: '#6b7280'}}/> },
};

export type MessageType = keyof typeof MESSAGE_TYPE_CONFIG;
export interface MessageItem {
  id: number;
  content: string;
  type?: MessageType;
  duration?: number;
}

const MessageBox: React.FC<{ messages: MessageItem[], onClose: (id:number)=>void }> = ({ messages, onClose }) => {
  React.useEffect(() => {
    if (!messages.length) return;
    messages.forEach(msg => {
      if (msg.duration !== 0) {
        const timer = setTimeout(() => onClose(msg.id), msg.duration ?? 3000);
        return () => clearTimeout(timer);
      }
    });
  }, [messages, onClose]);
  if (!messages.length) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 32,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      pointerEvents: 'none',
      minWidth: 220,
      maxWidth: '90vw',
    }}>
      {messages.map(msg => {
        const conf = MESSAGE_TYPE_CONFIG[msg.type || 'info'];
        return (
          <div key={msg.id} style={{
            background: conf.bg,
            color: conf.color,
            padding: '12px 32px',
            borderRadius: 8,
            fontSize: 16,
            boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
            minWidth: 180,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
            fontWeight: 500,
            border: `1.5px solid ${conf.color}`,
          }}>
            {conf.icon}
            <span style={{color: '#222'}}>{msg.content}</span>
          </div>
        );
      })}
    </div>
  );
};

export default MessageBox; 