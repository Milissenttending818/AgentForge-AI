import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const TriggerNode = ({ data }: { data: any }) => {
  return (
    <div style={{ background: '#faf5ff', border: '2px solid #9333ea', borderRadius: '8px', padding: '12px', width: '220px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
      <div style={{ fontWeight: 'bold', borderBottom: '1px solid #d8b4fe', marginBottom: '10px', paddingBottom: '4px', color: '#9333ea', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>⚡</span> Trigger Node
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <label style={{ fontSize: '11px', display: 'block', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Trigger Type</label>
        <select 
          style={{ width: '100%', fontSize: '12px', padding: '6px', borderRadius: '4px', border: '1px solid #e9d5ff', outline: 'none', background: 'white' }} 
          value={data.triggerType || 'webhook'} 
          onChange={(e) => data.onChange(e.target.value, 'triggerType')}
        >
          <option value="webhook">Webhook (POST)</option>
          <option value="schedule">Schedule (CRON)</option>
        </select>
      </div>

      {data.triggerType === 'webhook' && (
        <div style={{ marginTop: '10px', padding: '8px', background: '#f3e8ff', borderRadius: '4px' }}>
          <div style={{ fontSize: '10px', color: '#7e22ce', fontWeight: '600' }}>WEBHOOK URL</div>
          <div style={{ fontSize: '9px', color: '#9333ea', wordBreak: 'break-all', marginTop: '4px', fontFamily: 'monospace' }}>
            http://localhost:8000/webhook/{"{workflow_id}"}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Right} id="trigger-output" style={{ background: '#9333ea', width: '8px', height: '8px' }} />
    </div>
  );
};

export default memo(TriggerNode);
