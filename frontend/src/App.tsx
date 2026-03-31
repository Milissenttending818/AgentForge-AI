import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  applyEdgeChanges, 
  applyNodeChanges,
  ReactFlowProvider,
} from 'reactflow';
import type {
  Connection,
  Edge,
  Node,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';

import AgentNode from './nodes/AgentNode';
import TaskNode from './nodes/TaskNode';
import ToolNode from './nodes/ToolNode';
import TriggerNode from './nodes/TriggerNode';

const nodeTypes = {
  agent: AgentNode,
  task: TaskNode,
  tool: ToolNode,
  trigger: TriggerNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

let id = 0;
const getId = () => `node_${Date.now()}_${id++}`;

const App = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<string | null>(null);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect: OnConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onNodeDataChange = useCallback((nodeId: string, value: string, field: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              [field]: value,
            },
          };
        }
        return node;
      })
    );
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodeId = getId();
      const newNode: Node = {
        id: newNodeId,
        type,
        position,
        data: { 
          onChange: (val: string, field: string) => onNodeDataChange(newNodeId, val, field) 
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, onNodeDataChange]
  );

  const saveWorkflow = async () => {
    try {
      const payload = {
        name: workflowName,
        nodes: nodes.map(n => ({ id: n.id, type: n.type, data: n.data, position: n.position })),
        edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target }))
      };
      await axios.post('http://localhost:8000/workflows', payload);
      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save workflow.');
    }
  };

  const runWorkflow = async () => {
    if (nodes.length === 0) return alert("Please add some nodes first!");

    setLoading(true);
    setResult(null);
    setExecutionStatus('Starting...');

    const payload = {
      nodes: nodes.map(n => ({ id: n.id, type: n.type, data: n.data })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target }))
    };

    try {
      const response = await axios.post('http://localhost:8000/run-workflow', payload);
      setExecutionId(response.data.execution_id);
      setExecutionStatus('running');
    } catch (error) {
      setLoading(false);
      setExecutionStatus('Error starting workflow');
    }
  };

  // Poll for execution status
  useEffect(() => {
    let interval: any;
    if (executionId && executionStatus === 'running') {
      interval = setInterval(async () => {
        try {
          const response = await axios.get(`http://localhost:8000/executions/${executionId}`);
          if (response.data.status !== 'running' && response.data.status !== 'pending') {
            setExecutionStatus(response.data.status);
            setResult(response.data.result?.final_output || response.data.logs);
            setLoading(false);
            setExecutionId(null);
            clearInterval(interval);
          }
        } catch (e) {
          console.error('Polling error', e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [executionId, executionStatus]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      await axios.post('http://localhost:8000/upload-doc', formData);
      setUploadStatus(`Success: ${file.name} uploaded.`);
    } catch (error) {
      setUploadStatus('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const loadDemo = (type: 'competitive' | 'whatsapp') => {
    // simplified for brevity in this refactor
    const toolId = 'node_0';
    const agentId = 'node_1';
    const taskId = 'node_2';
    
    const demoNodes: Node[] = [
      { id: toolId, type: 'tool', position: { x: 50, y: 150 }, data: { toolType: type === 'competitive' ? 'PDF RAG' : 'Twilio WhatsApp', onChange: (val: string, field: string) => onNodeDataChange(toolId, val, field) } },
      { id: agentId, type: 'agent', position: { x: 350, y: 150 }, data: { role: 'Agent', goal: 'Help', backstory: 'Assistant', onChange: (val: string, field: string) => onNodeDataChange(agentId, val, field) } },
      { id: taskId, type: 'task', position: { x: 650, y: 150 }, data: { description: 'Do task', expectedOutput: 'Done', onChange: (val: string, field: string) => onNodeDataChange(taskId, val, field) } },
    ];
    setNodes(demoNodes);
    setEdges([
      { id: 'e1', source: toolId, target: agentId },
      { id: 'e2', source: agentId, target: taskId }
    ]);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{ padding: '12px 24px', background: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', letterSpacing: '-0.025em' }}>AgentForge <span style={{ color: '#38bdf8' }}>AI</span></h1>
          <input 
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            style={{ background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '14px', width: '250px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => loadDemo('competitive')} style={{ padding: '8px 14px', background: '#334155', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Load Demo</button>
          <button onClick={saveWorkflow} style={{ padding: '8px 14px', background: '#334155', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Save Workflow</button>
          <button 
            onClick={runWorkflow} 
            disabled={loading}
            style={{ padding: '8px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: 'background 0.2s' }}
          >
            {loading ? `Running (${executionStatus})...` : 'Execute Workflow'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{ width: '300px', borderRight: '1px solid #e2e8f0', padding: '24px', background: 'white', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <section>
            <div style={{ fontWeight: '700', marginBottom: '12px', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Document Assets</div>
            <div style={{ padding: '12px', background: '#f1f5f9', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ fontSize: '12px', width: '100%' }} />
              {uploading && <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '8px' }}>Uploading...</div>}
              {uploadStatus && <div style={{ fontSize: '11px', color: '#059669', marginTop: '8px' }}>{uploadStatus}</div>}
            </div>
          </section>

          <section>
            <div style={{ fontWeight: '700', marginBottom: '12px', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Node Palette</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div 
                style={{ padding: '12px', border: '1.5px solid #9333ea', cursor: 'grab', background: '#faf5ff', borderRadius: '8px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }} 
                onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'trigger')} 
                draggable
              >
                <span style={{ fontSize: '16px' }}>⚡</span> Trigger Node
              </div>
              <div 
                style={{ padding: '12px', border: '1.5px solid #2563eb', cursor: 'grab', background: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }} 
                onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'agent')} 
                draggable
              >
                <span style={{ fontSize: '16px' }}>🤖</span> Agent Node
              </div>
              <div 
                style={{ padding: '12px', border: '1.5px solid #10b981', cursor: 'grab', background: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }} 
                onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'task')} 
                draggable
              >
                <span style={{ fontSize: '16px' }}>✅</span> Task Node
              </div>
              <div 
                style={{ padding: '12px', border: '1.5px solid #f59e0b', cursor: 'grab', background: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }} 
                onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'tool')} 
                draggable
              >
                <span style={{ fontSize: '16px' }}>🛠️</span> Tool Node
              </div>
            </div>
          </section>

          {result && (
            <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
              <div style={{ fontWeight: '700', marginBottom: '12px', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Execution Output</div>
              <div style={{ flex: 1, fontSize: '12px', overflow: 'auto', background: '#0f172a', color: '#f8fafc', padding: '16px', borderRadius: '8px', whiteSpace: 'pre-wrap', lineHeight: '1.5', fontFamily: 'monospace' }}>
                {result}
              </div>
            </section>
          )}
        </aside>

        {/* Canvas */}
        <div style={{ flex: 1, background: '#f1f5f9' }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#cbd5e1" gap={20} />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default () => (
  <ReactFlowProvider>
    <App />
  </ReactFlowProvider>
);
