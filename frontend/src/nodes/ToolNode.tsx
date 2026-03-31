import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Wrench } from 'lucide-react';
import { Card } from "@/components/ui/card";

const ToolNode = ({ data, selected }: { data: any, selected: boolean }) => {
  return (
    <Card 
      style={{ backgroundColor: '#1a1a1a' }}
      className={`w-[140px] p-3 shadow-2xl border-2 transition-all opacity-100 ${selected ? 'border-indigo-500 shadow-indigo-500/20' : 'border-border'}`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
          <Wrench size={20} />
        </div>
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider truncate w-[110px] text-white">{data.toolType || 'Tool'}</p>
          <p className="text-[9px] text-muted-foreground font-medium mt-0.5">External Integration</p>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-2 !h-2 !bg-indigo-500 !border-2 !border-[#1a1a1a]"
      />
    </Card>
  );
};

export default memo(ToolNode);
