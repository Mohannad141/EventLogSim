from pydantic import BaseModel, Field
from typing import List, Optional

# 1. Process Configuration
class ProcessConfig(BaseModel):
    mode: str  # "BPMN_BASED" or "LLM_BASED"
    description: str
    bpmnFile: Optional[dict] = None  # Metadata about the file (name, size)

# 2. Agent Configuration
class AgentConfig(BaseModel):
    id: str
    name: str
    role: str
    age: Optional[int] = None
    description: str
    actions: List[str]

# 3. Attribute Configuration
class AttributeConfig(BaseModel):
    id: str
    name: str
    type: str  # e.g., "string", "number", "datetime"
    locked: bool = False

# 4. Simulation Settings
class SimulationConfig(BaseModel):
    caseCount: int = Field(ge=1, le=10000) # ge = greater than or equal, le = less than or equal
    seed: Optional[int] = None

# 5. The Top-Level "Config" Object
class SimulationRunConfig(BaseModel):
    process: ProcessConfig
    agents: List[AgentConfig]
    attributes: List[AttributeConfig]
    simulation: SimulationConfig
