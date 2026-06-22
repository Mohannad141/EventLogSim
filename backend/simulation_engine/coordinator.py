import json
from typing import Any, Dict, List, Optional

from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field


coordinator_debug_print_count = 0
MAX_DEBUG_PRINTS = 3


ASSIGNMENT_PROMPT = """\
You are the coordinator of a process simulation.

Your task is to assign one unfinished process instance to one suitable agent.

Unfinished process instances:
{process_states}

Available agents:
{agents}

Each process instance may include an "allowed_next_actions" field listing the actions
that are permitted as the next step. If "allowed_next_actions" is present and non-empty
for the instance you choose, the next action MUST be one of those, and you MUST pick an
agent whose own "actions" list includes at least one of those allowed actions.
If "allowed_next_actions" is missing or empty, use your own judgement and prefer an
agent whose role and actions fit the current process state.

Spread work across cases: among the unfinished instances, prefer the one with the
LOWEST "number_of_events" so every case advances roughly in parallel. Avoid
repeatedly returning to a case that is already further along while other cases
have zero events.

Also vary the chosen agent and action when possible — do not keep assigning the
same agent to the same case over and over with the same action; that produces an
unrealistic event log.

Choose exactly one process_id and one agent_id from the provided lists.
Write a short message to the selected agent.

{format_instructions}
"""


class AgentProcessAssignment(BaseModel):
    agent_id: str = Field(..., description="The id of the selected agent")
    process_id: str = Field(..., description="The id of the selected process instance")
    message: Optional[str] = Field(default=None, description="Message from the coordinator to the selected agent")


class Coordinator(BaseModel):

    def assign_agent_project(
        self,
        llm: Any,
        process_states: List[Dict[str, Any]],
        agents: List[Dict[str, Any]],
    ) -> AgentProcessAssignment:
        
        if not process_states:
            raise ValueError("There is no unfinished process instance to assign.")

        if not agents:
            raise ValueError("There is no agent available for assignment.")

        # Use manual JSON parser to avoid Groq's json_schema restriction
        parser = JsonOutputParser(pydantic_object=AgentProcessAssignment)

        prompt_template = PromptTemplate(
            template=ASSIGNMENT_PROMPT,
            input_variables=["process_states", "agents"],
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )
        
        prompt = prompt_template.format(
            process_states=json.dumps(process_states, indent=2),
            agents=json.dumps(agents, indent=2),
        )

        # Standard invoke (no with_structured_output)
        response = llm.invoke(prompt)
        
        try:
            # Parse the string response into our Pydantic model
            parsed_data = parser.parse(response.content)
            assignment = AgentProcessAssignment(**parsed_data)
        except Exception as e:
            print(f"Failed to parse coordinator output: {e}")
            print(f"Raw response: {response.content}")
            raise ValueError(f"Coordinator returned invalid JSON: {e}")

        global coordinator_debug_print_count
        if coordinator_debug_print_count < MAX_DEBUG_PRINTS:
            print(f"\n=== Debug Circle {coordinator_debug_print_count + 1}: Coordinator Assignment ===")
            print(assignment)
            coordinator_debug_print_count += 1

        process_ids = {process_state["process_id"] for process_state in process_states}
        agent_ids = {agent["id"] for agent in agents}

        if assignment.process_id not in process_ids:
            raise ValueError(f"Unknown process instance: {assignment.process_id}")

        if assignment.agent_id not in agent_ids:
            raise ValueError(f"Unknown agent: {assignment.agent_id}")

        return assignment
