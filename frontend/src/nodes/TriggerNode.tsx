import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Zap } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TriggerNode = ({ data, selected }: { data: any, selected: boolean }) => {
  return (
    <Card 
      style={{ backgroundColor: '#1a1a1a' }}
      className={`w-[140px] p-3 shadow-2xl border-2 transition-all opacity-100 ${selected ? 'border-orange-500 shadow-orange-500/20' : 'border-border'}`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
          <Zap size={20} fill="currentColor" />
        </div>
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white">Trigger</p>
          <Badge variant="secondary" className="text-[9px] py-0 px-1 mt-1 font-medium bg-orange-500/10 text-orange-500 border-none">
            {data.triggerType === 'webhook' ? 'Webhook' : 'Cron'}
          </Badge>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-2 !h-2 !bg-orange-500 !border-2 !border-[#1a1a1a]"
      />
    </Card>
  );
};

export default memo(TriggerNode);
