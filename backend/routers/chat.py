from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from simulation_engine.llm_factory import get_llm
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

router = APIRouter()

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        llm = get_llm()
        
        system_prompt = """You are the EventLogSim AI Assistant, a helpful helper for the EventLogSim application.
EventLogSim is a process simulation platform where users can:
1. Configure a process:
   - BPMN-based mode: Upload a .bpmn file to simulate a process constrained by transition flows.
   - Text-based (PURE_LLM) mode: Enter a textual description of the process.
2. Configure Agents (Actors):
   - Agents are defined by Name, Role, Age, Description, and Actions they can perform.
   - In BPMN-based mode, agents are automatically extracted from pools/lanes inside the uploaded BPMN file (if available), which overrides user-defined agents. If no pools are in the BPMN, it falls back to user-defined agents.
3. Configure Case Attributes:
   - Attributes (like priority, department) that are injected into every simulated event trace.
4. Run Simulations:
   - Run a simulation specifying the number of cases to generate.
   - The engine generates case traces using a coordinator and actor LLM framework.
   - Results are stored in a PostgreSQL database and rendered as an event log and analytic charts.
5. Runs & History:
   - Displays all historical simulation runs with status, case counts, and trace variants.
   - Users can compare logs, view trace variants, or export the generated logs as JSON.

Keep your answers concise, clear, and focused entirely on this application. If the user asks about unrelated topics (e.g. general programming, recipes, history, general knowledge), politely decline and tell them you can only assist with the EventLogSim project."""

        langchain_messages = [SystemMessage(content=system_prompt)]
        
        for msg in request.messages:
            if msg.role == "user":
                langchain_messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                langchain_messages.append(AIMessage(content=msg.content))
                
        # Invoke LLM
        response = await llm.ainvoke(langchain_messages)
        return ChatResponse(response=response.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
