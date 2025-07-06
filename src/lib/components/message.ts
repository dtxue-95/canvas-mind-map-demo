import { MessageType, MessageItem } from './MessageBox';

let idSeed = 1;

export type MessageArgs = {
  content: string;
  duration?: number;
};

type Listener = (messages: MessageItem[]) => void;

class MessageManager {
  private listeners: Listener[] = [];
  private messages: MessageItem[] = [];

  private notify() {
    this.listeners.forEach(fn => fn([...this.messages]));
  }

  subscribe(fn: Listener) {
    this.listeners.push(fn);
    fn([...this.messages]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  add(type: MessageType, args: string | MessageArgs) {
    const id = idSeed++;
    const msg: MessageItem = {
      id,
      content: typeof args === 'string' ? args : args.content,
      type,
      duration: typeof args === 'string' ? 3000 : args.duration ?? 3000,
    };
    this.messages.push(msg);
    this.notify();
    if (msg.duration !== 0) {
      setTimeout(() => this.remove(id), msg.duration);
    }
  }

  remove(id: number) {
    this.messages = this.messages.filter(m => m.id !== id);
    this.notify();
  }

  // API
  success = (args: string | MessageArgs) => this.add('success', args);
  error = (args: string | MessageArgs) => this.add('error', args);
  info = (args: string | MessageArgs) => this.add('info', args);
  warning = (args: string | MessageArgs) => this.add('warning', args);
  custom = (args: string | MessageArgs) => this.add('custom', args);
}

const message = new MessageManager();
export default message; 