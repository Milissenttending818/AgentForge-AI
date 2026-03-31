import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Bot } from 'lucide-react';
import { Card } from "@/components/ui/card";

const AgentNode = ({ data, selected }: { data: any, selected: boolean }) => {
  return (
    <Card 
      style={{ backgroundColor: '#1a1a1a' }}
      className={`w-[140px] p-3 shadow-2xl border-2 transition-all opacity-100 ${selected ? 'border-sky-500 shadow-sky-500/20' : 'border-border'}`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
          <Bot size={20} />
        </div>
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider truncate w-[110px] text-white">{data.role || 'Agent'}</p>
          <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Autonomous Agent</p>
        </div>
      </div>

      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-2 !h-2 !bg-indigo-500 !border-2 !border-[#1a1a1a]"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-2 !h-2 !bg-sky-500 !border-2 !border-[#1a1a1a]"
      />
    </Card>
  );
};

export default memo(AgentNode);
