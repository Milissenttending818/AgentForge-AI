import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { ShieldCheck } from 'lucide-react';
import { Card } from "@/components/ui/card";

const ApprovalNode = ({ selected }: { selected: boolean }) => {
  return (
    <Card 
      style={{ backgroundColor: '#1a1a1a' }}
      className={`w-[140px] p-3 shadow-2xl border-2 transition-all opacity-100 ${selected ? 'border-amber-500 shadow-amber-500/20' : 'border-border'}`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
          <ShieldCheck size={20} />
        </div>
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white">Approval</p>
          <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Security Gate</p>
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-amber-500 !border-2 !border-[#1a1a1a]" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-amber-500 !border-2 !border-[#1a1a1a]" />
    </Card>
  );
};

export default memo(ApprovalNode);
