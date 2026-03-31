import { useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { Terminal, X, Maximize2, Minimize2, Circle } from 'lucide-react';

interface LogEntry {
  node: string;
  status: string;
  content: string;
  timestamp: string;
}

const nodeColors: Record<string, string> = {
  'Architect': '#38bdf8',
  'Coder': '#10b981',
  'Reviewer': '#f59e0b',
  'System': '#94a3b8',
  'Trigger': '#ff6d5a'
};

const ExecutionTerminal = ({ executionId, onClose }: { executionId: string, onClose: () => void }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const API_WS_URL = import.meta.env.VITE_API_URL?.replace('http', 'ws') || 'ws://localhost:8000';
    const socket = new WebSocket(`${API_WS_URL}/ws/execution/${executionId}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'log') {
          setLogs(prev => [...prev, {
            node: data.node || 'System',
            status: data.status || 'info',
            content: data.content,
            timestamp: new Date().toLocaleTimeString()
          }]);
        }
      } catch (e) {
        setLogs(prev => [...prev, {
          node: 'System',
          status: 'raw',
          content: event.data,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    };

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [executionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Draggable handle=".terminal-header" bounds="parent">
      <div className={`fixed bottom-10 right-10 z-[1000] flex flex-col bg-[#0f172a] rounded-xl border border-[#334155] shadow-2xl overflow-hidden transition-all duration-300 ${isMinimized ? 'w-[240px] h-[40px]' : 'w-[500px] h-[300px]'}`}>
        {/* Header */}
        <div className="terminal-header flex items-center justify-between px-4 py-2 bg-[#1e293b] border-b border-[#334155] cursor-grab active:cursor-grabbing">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-sky-400" />
            <span className="text-[10px] font-bold text-slate-200 tracking-wider">LIVE TELEMETRY</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-slate-700 rounded text-slate-400">
              {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            </button>
            <button onClick={onClose} className="p-1 hover:bg-red-900/20 rounded text-slate-400 hover:text-red-400">
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Logs */}
        {!isMinimized && (
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2">
            {logs.length === 0 && <div className="text-slate-500 italic">Connecting to agent stream...</div>}
            {logs.map((log, i) => (
              <div key={i} className="flex gap-3 animate-in fade-in duration-300">
                <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                <span style={{ color: nodeColors[log.node] || '#94a3b8' }} className="font-bold flex items-center gap-1 shrink-0 uppercase text-[9px]">
                  <Circle size={6} fill="currentColor" className="border-none" /> {log.node}
                </span>
                <span className="text-slate-200 break-words">{log.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default ExecutionTerminal;
