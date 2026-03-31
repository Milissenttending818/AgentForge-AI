import React, { useState, useCallback, useRef, useMemo } from 'react';
import ReactFlow, { 
  addEdge, Background, Controls, applyEdgeChanges, applyNodeChanges, ReactFlowProvider, BackgroundVariant
} from 'reactflow';
import type { Connection, Edge, Node, OnNodesChange, OnEdgesChange, OnConnect } from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Icons
import { 
  Play, Save, Database, Settings, HelpCircle, Layers,
  ChevronRight, History, Bug
} from 'lucide-react';

import AgentNode from './nodes/AgentNode';
import TaskNode from './nodes/TaskNode';
import ToolNode from './nodes/ToolNode';
import TriggerNode from './nodes/TriggerNode';
import ApprovalNode from './nodes/ApprovalNode';
import RouterNode from './nodes/RouterNode';
import ExecutionTerminal from './components/ExecutionTerminal';
import { CustomIcons } from './components/Icons';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const App = () => {
  const nodeTypes = useMemo(() => ({
    agent: AgentNode,
    task: TaskNode,
    tool: ToolNode,
    trigger: TriggerNode,
    approval: ApprovalNode,
    router: RouterNode,
  }), []);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [loading, setLoading] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [versionCount, setVersionCount] = useState(1);
  const [showTemplates, setShowTemplates] = useState(false);

  const loadTemplate = async (name: string) => {
    const templates: Record<string, any> = {
      'HITL Security Gate Demo': {
        nodes: [
          {id: 't1', type: 'trigger', position: {x: 100, y: 200}, data: {triggerType: 'webhook', onChange: () => {}}},
          {id: 'a1', type: 'agent', position: {x: 300, y: 200}, data: {role: 'Architect', goal: 'Design architecture', onChange: () => {}}},
          {id: 'hitl1', type: 'approval', position: {x: 500, y: 200}, data: {onChange: () => {}}},
          {id: 'a2', type: 'agent', position: {x: 700, y: 200}, data: {role: 'Reviewer', goal: 'Verify design', onChange: () => {}}}
        ],
        edges: [
          {id: 'e1', source: 't1', target: 'a1', animated: true, type: 'smoothstep', style: { stroke: '#94a3b8', strokeWidth: 2 }},
          {id: 'e2', source: 'a1', target: 'hitl1', animated: true, type: 'smoothstep', style: { stroke: '#94a3b8', strokeWidth: 2 }},
          {id: 'e3', source: 'hitl1', target: 'a2', animated: true, type: 'smoothstep', style: { stroke: '#94a3b8', strokeWidth: 2 }}
        ]
      }
    };
    if (templates[name]) { setNodes(templates[name].nodes); setEdges(templates[name].edges); setWorkflowName(name); setShowTemplates(false); }
  };

  const onNodesChange: OnNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange: OnEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect: OnConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, type: 'smoothstep', style: { stroke: '#475569', strokeWidth: 2 } }, eds)), []);

  const onNodeDataChange = useCallback((nodeId: string, value: string, field: string) => {
    setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, [field]: value } } : node));
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type || !reactFlowInstance) return;
    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const newNodeId = `node_${Date.now()}`;
    setNodes((nds) => nds.concat({ id: newNodeId, type, position, data: { onChange: (val: string, field: string) => onNodeDataChange(newNodeId, val, field) } }));
  }, [reactFlowInstance, onNodeDataChange]);

  const saveWorkflow = async () => {
    try {
      const payload = { name: workflowName, nodes: nodes.map(n => ({ id: n.id, type: n.type, data: n.data, position: n.position })), edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })) };
      const res = await axios.post(`${API_BASE_URL}/workflows`, payload);
      setVersionCount(res.data.version || versionCount + 1);
      alert('Design versioned and saved.');
    } catch (error) { alert('Save failed.'); }
  };

  const runWorkflow = async () => {
    if (nodes.length === 0) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/run-workflow`, {
        nodes: nodes.map(n => ({ id: n.id, type: n.type, data: n.data })),
        edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
        debug: debugMode
      });
      setExecutionId(response.data.job_id);
    } catch (error) { setLoading(false); }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex h-screen w-screen bg-background text-foreground font-sans antialiased overflow-hidden text-white">
      <aside className="w-16 flex flex-col items-center py-6 gap-8 border-r border-border bg-card z-20">
        <div onClick={() => setShowTemplates(!showTemplates)} className="p-2 bg-primary/10 rounded-xl text-primary cursor-pointer hover:scale-110 transition-all text-orange-500"><Layers size={24} strokeWidth={2.5} /></div>
        
        <div className="flex flex-col gap-4">
          {[
            { icon: Database, label: "Variables" },
            { icon: Settings, label: "Settings" },
            { icon: HelpCircle, label: "Docs" }
          ].map((item, i) => (
            <div key={i} className="p-2 rounded-md cursor-pointer transition-colors text-muted-foreground hover:bg-muted">
              <item.icon size={20} />
            </div>
          ))}
        </div>

        <div className="mt-auto flex flex-col items-center gap-4">
          <Badge variant="outline" className="text-[10px] py-0 px-1 opacity-50 uppercase tracking-widest text-white border-white/20">Alpha</Badge>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-lg">SR</div>
        </div>
      </aside>

      {showTemplates && (
        <div className="absolute left-16 top-0 bottom-0 w-64 bg-background border-r border-border z-30 p-6 shadow-2xl animate-in slide-in-from-left duration-200">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">Enterprise Templates</p>
          <div className="flex flex-col gap-2">
            {['HITL Security Gate Demo'].map(name => (
              <Button key={name} variant="ghost" onClick={() => loadTemplate(name)} className="justify-start text-xs font-semibold">{name}</Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 relative">
        <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-border bg-background z-10 text-white">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight">AgentForge</span>
              <ChevronRight size={14} className="text-muted-foreground" />
              <Input value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} className="h-8 border-none bg-transparent hover:bg-muted focus-visible:ring-0 font-medium text-sm w-48 transition-colors text-white" />
            </div>
            <Badge variant="secondary" className="gap-1 bg-muted/50 text-muted-foreground border-none">
              <History size={12} /> v{versionCount}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-muted/30 rounded-lg p-1 border border-border">
              <Button variant={debugMode ? "default" : "ghost"} size="sm" onClick={() => setDebugMode(!debugMode)} className={`h-7 px-3 gap-2 text-[11px] font-bold uppercase tracking-wider ${debugMode ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}>
                <Bug size={14} /> {debugMode ? "Debug ON" : "Debug Off"}
              </Button>
            </div>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="outline" size="sm" onClick={saveWorkflow} className="h-8 font-semibold"><Save size={14} className="mr-2" /> Save</Button>
            <Button size="sm" onClick={runWorkflow} disabled={loading} className="h-8 font-bold bg-primary text-primary-foreground"><Play size={14} fill="currentColor" className="mr-2" /> Execute</Button>
          </div>
        </header>

        <main className="flex-1 relative bg-muted/10 min-h-0">
          <Card style={{ backgroundColor: '#0a0a0a' }} className="absolute left-6 top-6 w-48 p-4 shadow-2xl border-border z-[5] text-white">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Core Nodes</p>
            <div className="flex flex-col gap-2 text-white">
              {[
                { type: 'trigger', icon: CustomIcons.Trigger, label: 'Trigger', color: 'text-orange-500' },
                { type: 'agent', icon: CustomIcons.Agent, label: 'Agent', color: 'text-sky-500' },
                { type: 'task', icon: CustomIcons.Task, label: 'Task', color: 'text-emerald-500' },
                { type: 'tool', icon: CustomIcons.Tool, label: 'Tool', color: 'text-indigo-500' },
                { type: 'approval', icon: CustomIcons.Approval, label: 'Gate', color: 'text-amber-500' },
              ].map(item => (
                <div key={item.type} draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', item.type)} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-background hover:border-primary transition-all cursor-grab active:cursor-grabbing shadow-sm text-white">
                  <item.icon size={18} className={item.color} />
                  <span className="text-[12px] font-semibold text-white">{item.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="absolute inset-0 z-0" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes} edges={edges}
              onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
              onInit={setReactFlowInstance} onDrop={onDrop} onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onNodeClick={(_: any, n: Node) => setSelectedNodeId(n.id)} onPaneClick={() => setSelectedNodeId(null)}
              nodeTypes={nodeTypes}
              fitView={false}
              minZoom={0.1}
              maxZoom={1.5}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            >
              <Background color="#cbd5e1" gap={20} variant={BackgroundVariant.Dots} size={1} />
              <Controls position="bottom-left" className="!bg-background !border-border !shadow-lg" />
            </ReactFlow>
          </div>
          {executionId && <ExecutionTerminal executionId={executionId} onClose={() => { setExecutionId(null); setLoading(false); }} />}
          {selectedNode && (
            <Card className="absolute right-6 top-6 w-80 bottom-6 shadow-xl border-border bg-card z-[5] flex flex-col text-white">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="font-bold text-sm uppercase tracking-wider">{selectedNode.type} Settings</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedNodeId(null)}><ChevronRight size={16} /></Button>
              </div>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {selectedNode.type === 'agent' && (
                    <div className="space-y-4 text-white">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Agent Role</label>
                        <Input value={selectedNode.data.role || ''} onChange={(e) => onNodeDataChange(selectedNode.id, e.target.value, 'role')} className="h-9 bg-background text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Goal</label>
                        <textarea className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-1 focus:ring-primary text-white" value={selectedNode.data.goal || ''} onChange={(e) => onNodeDataChange(selectedNode.id, e.target.value, 'goal')} />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default () => (<ReactFlowProvider><App /></ReactFlowProvider>);
