import React, { useEffect, useState } from 'react';
import MessageBox, { MessageItem } from './MessageBox';
import message from './message';

const GlobalMessageBox: React.FC = () => {
  const [messages, setMessages] = useState<MessageItem[]>([]);

  useEffect(() => {
    const unsubscribe = message.subscribe(setMessages);
    return () => unsubscribe();
  }, []);

  return <MessageBox messages={messages} onClose={id => message.remove(id)} />;
};

export default GlobalMessageBox; 