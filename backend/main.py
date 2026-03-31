from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import shutil
import os
import datetime
from sqlalchemy.orm import Session
from database import get_db, Workflow, Execution
from agents import execute_crew_workflow

app = FastAPI()

# Ensure data directory exists
UPLOAD_DIR = "data"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for API ---

class NodeSchema(BaseModel):
    id: str
    type: str
    data: Dict[str, Any] = {}

class EdgeSchema(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None

class BlueprintSchema(BaseModel):
    nodes: List[NodeSchema]
    edges: List[EdgeSchema]

class WorkflowCreate(BaseModel):
    name: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

# --- Workflow Endpoints ---

@app.post("/workflows")
async def save_workflow(workflow_data: WorkflowCreate, db: Session = Depends(get_db)):
    """
    Saves or updates an n8n-style workflow blueprint.
    """
    # Simple logic: create new for every POST, or update if we add ID later
    new_workflow = Workflow(
        name=workflow_data.name,
        nodes=workflow_data.nodes,
        edges=workflow_data.edges
    )
    db.add(new_workflow)
    db.commit()
    db.refresh(new_workflow)
    return {"id": new_workflow.id, "status": "saved"}

@app.get("/workflows")
async def list_workflows(db: Session = Depends(get_db)):
    """
    Returns a list of all saved workflow blueprints.
    """
    workflows = db.query(Workflow).all()
    return [{"id": w.id, "name": w.name, "created_at": w.created_at} for w in workflows]

@app.get("/workflows/{workflow_id}")
async def get_workflow(workflow_id: str, db: Session = Depends(get_db)):
    """
    Retrieves a specific workflow blueprint by ID.
    """
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {
        "id": workflow.id,
        "name": workflow.name,
        "nodes": workflow.nodes,
        "edges": workflow.edges
    }

# --- Execution Endpoints ---

@app.post("/webhook/{workflow_id}")
async def webhook_trigger(workflow_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Externally trigger a workflow via its ID.
    """
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # 1. Create Execution record
    execution = Execution(workflow_id=workflow_id, status="pending")
    db.add(execution)
    db.commit()
    db.refresh(execution)
    
    # 2. Start background task
    from database import SessionLocal
    background_tasks.add_task(
        run_workflow_task, 
        execution.id, 
        workflow.nodes, 
        workflow.edges, 
        SessionLocal
    )
    
    return {"execution_id": execution.id, "status": "triggered_via_webhook"}

def run_workflow_task(execution_id: str, nodes: List[Any], edges: List[Any], db_session_factory):
    """
    Background worker that runs the CrewAI logic and updates the database.
    """
    db = db_session_factory()
    
    def log_update(message: str):
        # Nested function to handle DB updates for logs
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if execution:
            execution.logs += message
            db.commit()

    try:
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        execution.status = "running"
        db.commit()
        
        # Execute the actual multi-agent logic
        result = execute_crew_workflow(nodes, edges, log_callback=log_update)
        
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        execution.status = "completed"
        execution.result = {"final_output": str(result)}
        execution.completed_at = datetime.datetime.utcnow()
        db.commit()
    except Exception as e:
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if execution:
            execution.status = "failed"
            execution.logs += f"\nCritical Error: {str(e)}"
            db.commit()
    finally:
        db.close()

@app.post("/run-workflow")
async def run_workflow(blueprint: BlueprintSchema, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Executes a workflow asynchronously and returns an execution ID.
    """
    # 1. Create Execution record
    execution = Execution(status="pending")
    db.add(execution)
    db.commit()
    db.refresh(execution)
    
    # 2. Start background task
    from database import SessionLocal
    background_tasks.add_task(
        run_workflow_task, 
        execution.id, 
        blueprint.nodes, 
        blueprint.edges, 
        SessionLocal
    )
    
    return {"execution_id": execution.id, "status": "started"}

@app.get("/executions/{execution_id}")
async def get_execution_status(execution_id: str, db: Session = Depends(get_db)):
    """
    Returns the current status, logs, and result of a specific execution.
    """
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    return {
        "id": execution.id,
        "status": execution.status,
        "result": execution.result,
        "logs": execution.logs,
        "started_at": execution.started_at,
        "completed_at": execution.completed_at
    }

# --- Legacy & Utility Endpoints ---

@app.post("/upload-doc")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    file_path = os.path.join(UPLOAD_DIR, "textbook.pdf")
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"status": "success", "filename": file.filename, "message": "Document uploaded and indexed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@app.get("/")
async def root():
    return {"message": "AgentForge AI Backend is running."}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
