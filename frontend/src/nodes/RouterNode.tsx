import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Split } from 'lucide-react';
import { Card } from "@/components/ui/card";

const RouterNode = ({ selected }: { selected: boolean }) => {
  return (
    <Card 
      style={{ backgroundColor: '#1a1a1a' }}
      className={`w-[140px] p-3 shadow-2xl border-2 transition-all opacity-100 ${selected ? 'border-pink-500 shadow-pink-500/20' : 'border-border'}`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500">
          <Split size={20} />
        </div>
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white">Router</p>
          <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Cognitive Path</p>
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-pink-500 !border-2 !border-[#1a1a1a]" />
      <Handle type="source" position={Position.Right} id="path-a" style={{ top: '30%' }} className="!w-2 !h-2 !bg-pink-500 !border-2 !border-[#1a1a1a]" />
      <Handle type="source" position={Position.Right} id="path-b" style={{ top: '70%' }} className="!w-2 !h-2 !bg-pink-500 !border-2 !border-[#1a1a1a]" />
    </Card>
  );
};

export default memo(RouterNode);
