from typing import Any, Dict, List, Optional

from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field


actor_debug_print_count = 0
MAX_DEBUG_PRINTS = 3


AGENT_EVENT_PROMPT = """\
You are an agent participating in a business process.

Process Summary: {process_summary}
Your Role: {role}
Your Profile/Description: {profile}
Available Actions: {actions}

Each action may require specific data. Below is a mapping of actions to their required data fields:
Action Data Mapping: {action_data_mapping}
You MUST always provide the required data for the action you choose to take. 

Each action requires all event data. List of event data attributes: {event_data_attributes}
You MUST always provide values for all event data attributes with each action you take.

You are assigned to the following current process instance with the message from the coordinator:
Process ID: {process_id}
Current Process State (History & Data): {process_state}
Coordinator Message: {coordinator_message}

You MUST use exactly this process ID in your output: {process_id}

Please analyze the current process state and coordinator message, and determine the most appropriate action to take.

DYNAMIC TERMINATION:
Set "is_terminal" to true ONLY if the action you are taking is the ABSOLUTE FINAL step for the entire process instance (e.g., the goal is achieved, the case is closed, and no more actions by ANY agent are needed).
If the process needs to be handed over to another role or another step is required, you MUST set "is_terminal" to false.
Example of terminal logic: An "Initial Check" is NEVER terminal. A "Final Delivery" or "Case Closure" is usually terminal.

{format_instructions}
"""


class EventAttribute(BaseModel):
    attribute: str = Field(..., description="The name of the attribute")
    value: str = Field(..., description="The value of the attribute")


class GeneratedEvent(BaseModel):
    process_id: str = Field(..., description="The unique identifier of the process instance")
    action: str = Field(..., description="The action chosen by the agent")
    start_timestamp: str = Field(..., description="The timestamp when the action started")
    end_timestamp: str = Field(..., description="The timestamp when the action ended")
    is_terminal: bool = Field(default=False, description="Set to true if this action completes the entire process instance.")
    case_data: Optional[List[EventAttribute]] = Field(default=None, description="A list of case data attributes relevant to the specific action")
    event_data: Optional[List[EventAttribute]] = Field(default=None, description="A list of event data attributes relevant to all actions")



class Agent(BaseModel):
    id: str
    role: str
    description: str = ""
    age: Optional[int] = None
    actions: List[str]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Agent":
        return cls(
            id=data["id"],
            role=data["role"],
            description=data.get("description", ""),
            age=data.get("age"),
            actions=data["actions"],
        )

    def profile_text(self) -> str:
        parts = []
        if self.description:
            parts.append(self.description)
        if self.age:
            parts.append(f"Age: {self.age}")
        
        return " ".join(parts) if parts else "No additional profile data."

    def generate_single_event(
        self,
        process_context: Dict[str, Any],
        current_process: Dict[str, Any],
        llm: Any,
    ) -> GeneratedEvent:
        # Use manual JSON parser to avoid Groq's json_schema restriction
        parser = JsonOutputParser(pydantic_object=GeneratedEvent)

        prompt_template = PromptTemplate(
            template=AGENT_EVENT_PROMPT,
            input_variables=[
                "process_summary", "role", "profile", "actions", 
                "action_data_mapping", "event_data_attributes", 
                "process_id", "process_state", "coordinator_message"
            ],
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )
        
        prompt = prompt_template.format(
            process_summary=process_context["process_summary"],
            role=self.role,
            profile=self.profile_text(),
            actions=", ".join(self.actions),
            action_data_mapping=process_context["action_data_mapping"],
            event_data_attributes=process_context["event_data_attributes"],
            process_id=current_process["process_id"],
            process_state=current_process["process_state"],
            coordinator_message=current_process["coordinator_message"],
        )
        
        # Standard invoke (no with_structured_output)
        response = llm.invoke(prompt)
        
        try:
            parsed_data = parser.parse(response.content)
            event = GeneratedEvent(**parsed_data)
        except Exception as e:
            print(f"Failed to parse actor output: {e}")
            print(f"Raw response: {response.content}")
            raise ValueError(f"Actor returned invalid JSON: {e}")

        global actor_debug_print_count
        if actor_debug_print_count < MAX_DEBUG_PRINTS:
            print(f"\n=== Debug Circle {actor_debug_print_count + 1}: Actor Event ===")
            print(event)
            actor_debug_print_count += 1

        if event.process_id != current_process["process_id"]:
            event = event.model_copy(update={"process_id": current_process["process_id"]})

        return event
