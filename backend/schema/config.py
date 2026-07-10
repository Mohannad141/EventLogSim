from pydantic import BaseModel, Field
from typing import List, Optional

class ProcessConfig(BaseModel):
    mode: str  # "BPMN_BASED" or "LLM_BASED"
    description: str
    bpmnFile: Optional[dict] = None 
    runName: Optional[str] = None

class AgentConfig(BaseModel):
    id: str
    name: str
    role: str
    age: Optional[int] = None
    description: str
    actions: List[str]

class AttributeConfig(BaseModel):
    id: str
    name: str
    type: str  # "string", "number", "datetime"
    description: Optional[str] = None
    locked: bool = False

class SimulationConfig(BaseModel):
    caseCount: int = Field(ge=1, le=10000) # ge = greater than or equal, le = less than or equal
   # seed: Optional[int] = None                             NO NEED FOR SEED IN THIS SIMULATION

class SimulationRunConfig(BaseModel):
    process: ProcessConfig
    agents: List[AgentConfig]
    attributes: List[AttributeConfig]
    simulation: SimulationConfig
