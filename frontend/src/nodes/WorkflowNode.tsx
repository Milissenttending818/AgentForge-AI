import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const WorkflowNode = ({ data, type }: { data: any, type: string }) => {
  const getHeaderColor = () => {
    switch (type) {
      case 'document_search': return '#2563eb';
      case 'ai_chat': return '#10b981';
      case 'whatsapp_send': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'document_search': return 'Document Search';
      case 'ai_chat': return 'AI Chat / Brain';
      case 'whatsapp_send': return 'WhatsApp Send';
      default: return 'Workflow Node';
    }
  };

  return (
    <div style={{ background: '#f8fafc', border: `2px solid ${getHeaderColor()}`, borderRadius: '8px', padding: '12px', width: '220px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      <div style={{ fontWeight: 'bold', borderBottom: `1px solid ${getHeaderColor()}`, marginBottom: '10px', paddingBottom: '4px', color: getHeaderColor(), fontSize: '14px' }}>
        {getTitle()}
      </div>
      
      {type === 'document_search' && (
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '11px', display: 'block', color: '#64748b' }}>Data Directory</label>
          <input 
            style={{ width: '100%', fontSize: '12px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
            value={data.params?.data_dir || './data'} 
            onChange={(e) => data.onChange(e.target.value, 'data_dir')} 
          />
        </div>
      )}

      {type === 'ai_chat' && (
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '11px', display: 'block', color: '#64748b' }}>Prompt Template</label>
          <textarea 
            style={{ width: '100%', fontSize: '12px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
            rows={3}
            value={data.params?.prompt_template || 'Summarize the following information: {context}'} 
            onChange={(e) => data.onChange(e.target.value, 'prompt_template')} 
          />
        </div>
      )}

      {type === 'whatsapp_send' && (
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '11px', display: 'block', color: '#64748b' }}>To Number</label>
          <input 
            style={{ width: '100%', fontSize: '12px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
            placeholder="+91XXXXXXXXXX"
            value={data.params?.to_number || ''} 
            onChange={(e) => data.onChange(e.target.value, 'to_number')} 
          />
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </div>
  );
};

export default memo(WorkflowNode);
