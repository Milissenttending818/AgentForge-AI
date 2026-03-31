import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import axios from 'axios';

const ToolNode = ({ data }: { data: any }) => {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setStatus('Uploading...');

    try {
      await axios.post('http://127.0.0.1:8000/upload-doc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus('✅ Success');
      if (data.onChange) data.onChange(file.name, 'filename');
    } catch (err) {
      setStatus('❌ Error');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc', border: '2px solid #f59e0b', borderRadius: '8px', padding: '12px', width: '220px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
      <div style={{ fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', marginBottom: '10px', paddingBottom: '6px', color: '#b45309', fontSize: '14px' }}>🛠️ Tool Node</div>
      
      <div style={{ marginBottom: '10px' }}>
        <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>TOOL TYPE</label>
        <select 
          style={{ width: '100%', fontSize: '12px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
          value={data.toolType || 'PDF RAG'} 
          onChange={(e) => data.onChange(e.target.value, 'toolType')}
        >
          <option value="PDF RAG">📂 PDF RAG</option>
          <option value="Twilio WhatsApp">💬 Twilio WhatsApp</option>
        </select>
      </div>

      {data.toolType === 'PDF RAG' && (
        <div style={{ background: '#fffbeb', padding: '8px', borderRadius: '4px', border: '1px dashed #fcd34d' }}>
          <label style={{ fontSize: '11px', fontWeight: '600', color: '#b45309', display: 'block', marginBottom: '4px' }}>UPLOAD PDF</label>
          <input 
            type="file" 
            accept=".pdf"
            onChange={handleFileChange}
            style={{ fontSize: '10px', width: '100%' }}
            disabled={uploading}
          />
          {status && <div style={{ fontSize: '10px', marginTop: '4px', fontWeight: 'bold' }}>{status}</div>}
        </div>
      )}

      {data.toolType === 'Twilio WhatsApp' && (
        <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
          Uses .env configured Twilio credentials.
        </div>
      )}

      <Handle type="source" position={Position.Right} id="agent-output" style={{ background: '#f59e0b', width: '8px', height: '8px' }} />
    </div>
  );
};

export default memo(ToolNode);
