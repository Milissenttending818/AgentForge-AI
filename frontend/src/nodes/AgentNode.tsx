import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const AgentNode = ({ data }: { data: any }) => {
  return (
    <div style={{ background: '#f5f5f5', border: '2px solid #2563eb', borderRadius: '8px', padding: '10px', width: '200px' }}>
      <Handle type="target" position={Position.Left} id="tool-input" style={{ background: '#555' }} />
      <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', marginBottom: '8px', paddingBottom: '4px', color: '#2563eb' }}>Agent Node</div>
      <div style={{ marginBottom: '4px' }}>
        <label style={{ fontSize: '12px', display: 'block' }}>Role</label>
        <input 
          style={{ width: '100%', fontSize: '12px' }} 
          value={data.role || ''} 
          onChange={(e) => data.onChange(e.target.value, 'role')} 
        />
      </div>
      <div style={{ marginBottom: '4px' }}>
        <label style={{ fontSize: '12px', display: 'block' }}>Goal</label>
        <textarea 
          style={{ width: '100%', fontSize: '12px' }} 
          rows={2}
          value={data.goal || ''} 
          onChange={(e) => data.onChange(e.target.value, 'goal')} 
        />
      </div>
      <div>
        <label style={{ fontSize: '12px', display: 'block' }}>Backstory</label>
        <textarea 
          style={{ width: '100%', fontSize: '12px' }} 
          rows={2}
          value={data.backstory || ''} 
          onChange={(e) => data.onChange(e.target.value, 'backstory')} 
        />
      </div>
      <Handle type="source" position={Position.Right} id="task-output" style={{ background: '#555' }} />
    </div>
  );
};

export default memo(AgentNode);
