import os
import sys
import io
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
from tools.rag_tool import PDFRagTool
from tools.twilio_tool import TwilioWhatsappTool

load_dotenv()

# --- Global Configuration ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.1-8b-instant"

def execute_crew_workflow(nodes, edges, log_callback=None):
    """
    Translates the React Flow graph into a CrewAI workflow.
    
    Args:
        nodes: List of node objects from the frontend.
        edges: List of edge objects from the frontend.
        log_callback: Optional function to call with log strings for persistence.
    """
    # Use the string format for CrewAI (LiteLLM)
    llm_name = f"groq/{GROQ_MODEL}"
    
    if log_callback:
        log_callback(f"Initializing workflow with {len(nodes)} nodes...\n")
    
    # 1. Parse Nodes by Type
    agent_nodes = [n for n in nodes if n.get('type') == 'agent']
    task_nodes = [n for n in nodes if n.get('type') == 'task']
    tool_nodes = [n for n in nodes if n.get('type') == 'tool']

    # 2. Build Tool Instances
    node_tools = {}
    for t_node in tool_nodes:
        data = t_node.get('data', {})
        tool_type = data.get('toolType', 'PDF RAG')
        if tool_type == 'PDF RAG':
            node_tools[t_node.get('id')] = [PDFRagTool()]
        elif tool_type == 'Twilio WhatsApp':
            node_tools[t_node.get('id')] = [TwilioWhatsappTool()]

    # 3. Create CrewAI Agents
    agents_map = {}
    for a_node in agent_nodes:
        data = a_node.get('data', {})
        connected_tools = []
        for edge in edges:
            if edge.get('target') == a_node.get('id'):
                if edge.get('source') in node_tools:
                    connected_tools.extend(node_tools[edge.get('source')])

        agent = Agent(
            role=data.get('role', 'General Assistant'),
            goal=data.get('goal', 'Help the user with their request'),
            backstory=data.get('backstory', 'You are a helpful AI assistant.'),
            tools=connected_tools,
            llm=llm_name,
            verbose=True,
            allow_delegation=False
        )
        agents_map[a_node.get('id')] = agent

    # 4. Create CrewAI Tasks
    tasks = []
    for t_node in task_nodes:
        data = t_node.get('data', {})
        assigned_agent = None
        for edge in edges:
            if edge.get('target') == t_node.get('id'):
                if edge.get('source') in agents_map:
                    assigned_agent = agents_map[edge.get('source')]
                    break
        
        task = Task(
            description=data.get('description', 'No description provided.'),
            expected_output=data.get('expectedOutput', 'Successful completion.'),
            agent=assigned_agent if assigned_agent else Agent(role="Default", goal="Complete task", backstory="Helper", llm=llm_name)
        )
        tasks.append(task)

    # 5. Assemble and Run the Crew
    crew = Crew(
        agents=list(agents_map.values()),
        tasks=tasks,
        process=Process.sequential,
        verbose=True
    )

    # Capture stdout for logging
    old_stdout = sys.stdout
    new_stdout = io.StringIO()
    sys.stdout = new_stdout

    try:
        if log_callback:
            log_callback("CrewAI execution started...\n")
        
        result = crew.kickoff()
        
        # After execution, flush any remaining stdout to the log
        if log_callback:
            log_callback(new_stdout.getvalue())
            
        return str(result)
    finally:
        sys.stdout = old_stdout
