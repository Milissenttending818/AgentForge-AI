import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const TaskNode = ({ data }: { data: any }) => {
  return (
    <div style={{ background: '#f5f5f5', border: '2px solid #10b981', borderRadius: '8px', padding: '10px', width: '200px' }}>
      <Handle type="target" position={Position.Left} id="agent-input" style={{ background: '#555' }} />
      <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', marginBottom: '8px', paddingBottom: '4px', color: '#10b981' }}>Task Node</div>
      <div style={{ marginBottom: '4px' }}>
        <label style={{ fontSize: '12px', display: 'block' }}>Description</label>
        <textarea 
          style={{ width: '100%', fontSize: '12px' }} 
          rows={3}
          value={data.description || ''} 
          onChange={(e) => data.onChange(e.target.value, 'description')} 
        />
      </div>
      <div>
        <label style={{ fontSize: '12px', display: 'block' }}>Expected Output</label>
        <textarea 
          style={{ width: '100%', fontSize: '12px' }} 
          rows={2}
          value={data.expectedOutput || ''} 
          onChange={(e) => data.onChange(e.target.value, 'expectedOutput')} 
        />
      </div>
    </div>
  );
};

export default memo(TaskNode);
